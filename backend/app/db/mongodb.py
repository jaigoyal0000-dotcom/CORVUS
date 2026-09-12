"""
MongoDB Database Connector and Collection Manager for CORVUS.
Provides asynchronous client access via Motor and synchronous access via PyMongo.
"""

import os
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger("corvus.mongodb")

_async_client = None
_sync_client = None
_async_db = None
_sync_db = None

def get_async_client():
    global _async_client
    if _async_client is None:
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            _async_client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=3000,
            )
        except Exception as e:
            logger.error(f"Failed to create AsyncIOMotorClient: {e}")
            _async_client = None
    return _async_client

def get_sync_client():
    global _sync_client
    if _sync_client is None:
        try:
            from pymongo import MongoClient
            _sync_client = MongoClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=3000,
            )
        except Exception as e:
            logger.error(f"Failed to create MongoClient: {e}")
            _sync_client = None
    return _sync_client

def get_mongodb():
    global _async_db
    client = get_async_client()
    if client is not None:
        _async_db = client[settings.MONGODB_DB_NAME]
    return _async_db

def get_sync_mongodb():
    global _sync_db
    client = get_sync_client()
    if client is not None:
        _sync_db = client[settings.MONGODB_DB_NAME]
    return _sync_db

# Collection accessors
def get_users_collection():
    db = get_mongodb()
    return db["users"] if db is not None else None

def get_projects_collection():
    db = get_mongodb()
    return db["projects"] if db is not None else None

def get_analyses_collection():
    db = get_mongodb()
    return db["analyses"] if db is not None else None

def get_disasters_collection():
    db = get_mongodb()
    return db["disaster_assessments"] if db is not None else None

async def init_mongodb():
    """
    Initialize indexes and default seed data in MongoDB collections.
    Safe to run repeatedly on startup.
    """
    db = get_mongodb()
    if db is None:
        logger.warning("MongoDB unavailable during init. Skipping index/seed.")
        return False

    try:
        # 1. Indexes for Users
        users_col = db["users"]
        await users_col.create_index("email", unique=True)
        await users_col.create_index("id", unique=True)

        # 2. Indexes for Projects
        projects_col = db["projects"]
        await projects_col.create_index("id", unique=True)
        await projects_col.create_index("created_at")

        # 3. Indexes for Analyses
        analyses_col = db["analyses"]
        await analyses_col.create_index("request_id", unique=True)
        await analyses_col.create_index("project_id")
        await analyses_col.create_index("created_at")

        # 4. Indexes for Disaster Assessments
        disasters_col = db["disaster_assessments"]
        await disasters_col.create_index("disaster_type")
        await disasters_col.create_index("created_at")

        # 5. Seed default demo users if empty
        user_count = await users_col.count_documents({})
        if user_count == 0:
            from app.core.security import hash_password
            seed_users = [
                {
                    "id": "usr_0001",
                    "email": "admin@corvus.ai",
                    "full_name": "Corvus Admin",
                    "hashed_password": hash_password("AdminPassword123!"),
                    "role": "admin",
                },
                {
                    "id": "usr_0002",
                    "email": "analyst@corvus.ai",
                    "full_name": "Jay Goyal (Lead Analyst)",
                    "hashed_password": hash_password("AnalystPassword123!"),
                    "role": "analyst",
                },
                {
                    "id": "usr_0003",
                    "email": "demo@corvus.ai",
                    "full_name": "Demo Operator",
                    "hashed_password": hash_password("DemoPassword123!"),
                    "role": "operator",
                },
            ]
            await users_col.insert_many(seed_users)
            logger.info("Seeded initial demo users in MongoDB (users collection).")

        # 6. Seed default projects if empty
        project_count = await projects_col.count_documents({})
        if project_count == 0:
            seed_projects = [
                {
                    "id": "proj_0001",
                    "name": "Delhi Urban Expansion & Land Cover",
                    "description": "Bi-temporal Sentinel-2 and Sentinel-1 SAR analysis over National Capital Region (2024 - 2026).",
                    "aoi_polygon": None,
                    "created_at": "2026-08-29T20:00:00Z",
                    "images": ["Delhi_Optical_T1.tif", "Delhi_Optical_T2.tif", "Delhi_SAR_VH.tif"],
                    "analyses": [],
                    "queries_count": 14,
                },
                {
                    "id": "proj_0002",
                    "name": "Yamuna River Flood Risk Assessment",
                    "description": "Multi-modal optical and SAR flood inundation mapping and water body extent tracking.",
                    "aoi_polygon": None,
                    "created_at": "2026-08-28T14:30:00Z",
                    "images": ["Yamuna_PreFlood.tif", "Yamuna_PostFlood.tif"],
                    "analyses": [],
                    "queries_count": 8,
                },
                {
                    "id": "proj_0003",
                    "name": "Industrial Infrastructure Monitoring",
                    "description": "Open-vocabulary visual grounding and building mask extraction over industrial zones.",
                    "aoi_polygon": None,
                    "created_at": "2026-08-25T11:15:00Z",
                    "images": ["Industrial_Zone_A.tif"],
                    "analyses": [],
                    "queries_count": 6,
                },
            ]
            await projects_col.insert_many(seed_projects)
            logger.info("Seeded initial projects in MongoDB (projects collection).")

        return True
    except Exception as e:
        logger.error(f"Error initializing MongoDB: {e}")
        return False

async def check_mongodb_health() -> Dict[str, Any]:
    """
    Check connection status with MongoDB server.
    """
    try:
        from pymongo import MongoClient
        client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        db = client[settings.MONGODB_DB_NAME]
        collections = db.list_collection_names()
        return {
            "status": "healthy",
            "database": settings.MONGODB_DB_NAME,
            "collections": collections,
            "url": settings.MONGODB_URL.split("@")[-1] if "@" in settings.MONGODB_URL else settings.MONGODB_URL,
        }
    except Exception as e:
        return {
            "status": "unreachable",
            "error": str(e),
            "url": settings.MONGODB_URL.split("@")[-1] if "@" in settings.MONGODB_URL else settings.MONGODB_URL,
        }
