from app.core.config import settings

try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker, declarative_base

    Base = declarative_base()

    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True,
    )

    AsyncSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
except Exception:
    Base = None
    engine = None
    AsyncSessionLocal = None

async def get_db():
    if AsyncSessionLocal is None:
        yield None
        return
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
