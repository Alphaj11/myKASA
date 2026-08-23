import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routers import admin, auth, contrats, dashboard, immeubles, locataires, logements, me, paiements, quittances
from app.services.pdf import STORAGE_ROOT

logger = logging.getLogger("mykasa.main")

app = FastAPI(title="MyKASA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Le schema est gere par les migrations Alembic (voir alembic/ et README) :
    # executez `alembic upgrade head` avant de demarrer l'API sur une base neuve.
    if settings.secret_key == "change-me-to-a-random-secret-in-production":
        logger.warning(
            "SECRET_KEY par defaut detectee : definissez une vraie valeur secrete dans .env avant tout deploiement."
        )


app.include_router(auth.router)
app.include_router(immeubles.router)
app.include_router(logements.router)
app.include_router(locataires.router)
app.include_router(contrats.router)
app.include_router(paiements.router)
app.include_router(quittances.router)
app.include_router(dashboard.router)
app.include_router(admin.router)
app.include_router(me.router)

_images_dir = os.path.join(STORAGE_ROOT, "images")
os.makedirs(_images_dir, exist_ok=True)
app.mount("/static/images", StaticFiles(directory=_images_dir), name="static_images")


@app.get("/api/health")
def health():
    return {"status": "ok"}
