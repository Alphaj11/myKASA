import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

_db_url = settings.database_url.replace("postgres://", "postgresql://", 1)
if _db_url.startswith("sqlite:///./"):
    _rel = _db_url[len("sqlite:///./"):]
    _backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    _db_url = f"sqlite:///{os.path.join(_backend_root, _rel)}"

connect_args = {"check_same_thread": False} if _db_url.startswith("sqlite") else {}

engine = create_engine(_db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
