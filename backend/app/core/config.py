import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    for env_path in [
        Path.cwd() / ".env",
        Path(__file__).resolve().parent.parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent.parent / ".env",
    ]:
        if env_path.is_file():
            load_dotenv(dotenv_path=env_path)
            break
except ImportError:
    pass

try:
    from pydantic_settings import BaseSettings
    
    class Settings(BaseSettings):
        PROJECT_NAME: str = "CORVUS — THE WATCHING CROW"
        VERSION: str = "0.1.0"
        API_V1_STR: str = "/api/v1"
        SECRET_KEY: str = os.getenv("SECRET_KEY", "corvus-secret-key-sih-2026-satquery-ai")
        
        # Environment
        ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
        
        # LLM & Vision-Language AI Keys
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
        LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-2.0-flash")
        
        # Database (PostgreSQL + PostGIS)
        POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
        POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
        POSTGRES_USER: str = os.getenv("POSTGRES_USER", "corvus")
        POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "corvus_password")
        POSTGRES_DB: str = os.getenv("POSTGRES_DB", "corvus_db")
        DATABASE_URL: str = os.getenv(
            "DATABASE_URL", 
            f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
        )

        # MinIO
        MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
        MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        MINIO_BUCKET_NAME: str = os.getenv("MINIO_BUCKET_NAME", "corvus-imagery")
        MINIO_USE_SSL: bool = os.getenv("MINIO_USE_SSL", "false").lower() == "true"

        # Redis & Celery
        REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
        REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
        CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
        CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

        # MongoDB
        MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "corvus_db")

        class Config:
            case_sensitive = True
            env_file = ".env"
            extra = "allow"

    settings = Settings()

except ImportError:
    from dataclasses import dataclass

    @dataclass
    class SettingsFallback:
        PROJECT_NAME: str = "CORVUS — THE WATCHING CROW"
        VERSION: str = "0.1.0"
        API_V1_STR: str = "/api/v1"
        SECRET_KEY: str = os.getenv("SECRET_KEY", "corvus-secret-key-sih-2026-satquery-ai")
        ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
        LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-2.0-flash")
        POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
        POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
        POSTGRES_USER: str = os.getenv("POSTGRES_USER", "corvus")
        POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "corvus_password")
        POSTGRES_DB: str = os.getenv("POSTGRES_DB", "corvus_db")
        DATABASE_URL: str = os.getenv(
            "DATABASE_URL", 
            f"postgresql+asyncpg://corvus:corvus_password@localhost:5432/corvus_db"
        )
        MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
        MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        MINIO_BUCKET_NAME: str = os.getenv("MINIO_BUCKET_NAME", "corvus-imagery")
        MINIO_USE_SSL: bool = False
        REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
        REDIS_PORT: int = 6379
        CELERY_BROKER_URL: str = "redis://localhost:6379/0"
        CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
        MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "corvus_db")

    settings = SettingsFallback()
