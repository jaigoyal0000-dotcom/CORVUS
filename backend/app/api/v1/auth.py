from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.db.mongodb import get_users_collection

router = APIRouter()

# In-memory user store for fallback if database is restarting
USERS_DB = {
    "admin@corvus.ai": {
        "id": "usr_0001",
        "email": "admin@corvus.ai",
        "full_name": "Corvus Admin",
        "hashed_password": hash_password("AdminPassword123!"),
        "role": "admin",
    },
    "analyst@corvus.ai": {
        "id": "usr_0002",
        "email": "analyst@corvus.ai",
        "full_name": "Jay Goyal (Lead Analyst)",
        "hashed_password": hash_password("AnalystPassword123!"),
        "role": "analyst",
    },
    "demo@corvus.ai": {
        "id": "usr_0003",
        "email": "demo@corvus.ai",
        "full_name": "Demo Operator",
        "hashed_password": hash_password("DemoPassword123!"),
        "role": "operator",
    },
}

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "analyst"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserRegister):
    users_col = get_users_collection()
    
    # Check if user exists in MongoDB
    if users_col is not None:
        try:
            existing = await users_col.find_one({"email": user_in.email})
            if existing:
                raise HTTPException(status_code=400, detail="User with this email already exists")
            count = await users_col.count_documents({})
            user_id = f"usr_{count + 1:04d}"
        except HTTPException:
            raise
        except Exception:
            if user_in.email in USERS_DB:
                raise HTTPException(status_code=400, detail="User with this email already exists")
            user_id = f"usr_{len(USERS_DB) + 1:04d}"
    else:
        if user_in.email in USERS_DB:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        user_id = f"usr_{len(USERS_DB) + 1:04d}"
    
    hashed_pwd = hash_password(user_in.password)
    user_data = {
        "id": user_id,
        "email": user_in.email,
        "full_name": user_in.full_name,
        "hashed_password": hashed_pwd,
        "role": user_in.role or "analyst",
    }
    
    # Save to MongoDB
    if users_col is not None:
        try:
            await users_col.insert_one(dict(user_data))
        except Exception as e:
            # Fallback to in-memory store
            USERS_DB[user_in.email] = user_data
    else:
        USERS_DB[user_in.email] = user_data

    # Also keep in-memory cache updated
    USERS_DB[user_in.email] = user_data
    
    token = create_access_token({"sub": user_id, "email": user_in.email, "role": user_data["role"]})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_in.email,
            "full_name": user_in.full_name,
            "role": user_data["role"],
        }
    }

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    users_col = get_users_collection()
    user = None
    
    # Query from MongoDB first
    if users_col is not None:
        try:
            user = await users_col.find_one({"email": credentials.email})
        except Exception:
            user = None

    # Fallback to in-memory if not found in Mongo or Mongo temporarily unavailable
    if not user:
        user = USERS_DB.get(credentials.email)

    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
        }
    }

@router.get("/profile", response_model=UserResponse)
async def profile(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization token")
        
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalid or expired")
        
    email = payload.get("email")
    user = None
    
    users_col = get_users_collection()
    if users_col is not None:
        try:
            user = await users_col.find_one({"email": email})
        except Exception:
            user = None
            
    if not user:
        user = USERS_DB.get(email)
        
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
    }
