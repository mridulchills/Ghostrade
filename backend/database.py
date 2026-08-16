import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ghostrade.db")

def _build_engine(url: str):
    """Build a SQLAlchemy engine, falling back to SQLite if Postgres is unreachable."""
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})

    # Fix Render/Supabase URLs: some providers give postgres:// instead of postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    try:
        pg_engine = create_engine(
            url,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=5,
            max_overflow=10,
        )
        # Test the connection immediately
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connected to PostgreSQL successfully.")
        return pg_engine
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed: {e}")
        logger.warning("Falling back to local SQLite database.")
        return create_engine(
            "sqlite:///./ghostrade.db",
            connect_args={"check_same_thread": False},
        )

engine = _build_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
