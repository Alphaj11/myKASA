from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
import app.models  # noqa: F401 -- ensures every model is registered on Base.metadata
from app.routers import admin, auth, contrats, dashboard, immeubles, locataires, logements, paiements, quittances

app = FastAPI(title="LocalTrack API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


app.include_router(auth.router)
app.include_router(immeubles.router)
app.include_router(logements.router)
app.include_router(locataires.router)
app.include_router(contrats.router)
app.include_router(paiements.router)
app.include_router(quittances.router)
app.include_router(dashboard.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
