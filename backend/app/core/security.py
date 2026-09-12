import hashlib
import hmac
import base64
import json
import time
from typing import Dict, Any, Optional
from app.core.config import settings

def hash_password(password: str) -> str:
    """Hashes a password using SHA-256 with salt."""
    salt = settings.SECRET_KEY[:16].encode('utf-8')
    pwd_bytes = password.encode('utf-8')
    hashed = hashlib.pbkdf2_hmac('sha256', pwd_bytes, salt, 100000)
    return base64.b64encode(hashed).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed password."""
    return hmac.compare_digest(hash_password(plain_password), hashed_password)

def create_access_token(data: Dict[str, Any], expires_in: int = 86400) -> str:
    """Creates a simple HMAC-SHA256 JWT access token."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_in
    
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    
    signature_input = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(settings.SECRET_KEY.encode(), signature_input, hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT access token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        
        header_b64, payload_b64, signature_b64 = parts
        
        # Verify signature
        signature_input = f"{header_b64}.{payload_b64}".encode()
        expected_sig = hmac.new(settings.SECRET_KEY.encode(), signature_input, hashlib.sha256).digest()
        
        # Padding fix
        rem = len(signature_b64) % 4
        if rem > 0:
            signature_b64 += "=" * (4 - rem)
            
        actual_sig = base64.urlsafe_b64decode(signature_b64.encode())
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
            
        # Parse payload
        rem_p = len(payload_b64) % 4
        if rem_p > 0:
            payload_b64 += "=" * (4 - rem_p)
            
        payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode()).decode())
        
        if payload.get("exp", 0) < time.time():
            return None # Expired
            
        return payload
    except Exception:
        return None
