import os
import uuid

from fastapi import HTTPException, UploadFile

from app.services.pdf import STORAGE_ROOT

DOCUMENTS_DIR = os.path.join(STORAGE_ROOT, "documents")
os.makedirs(DOCUMENTS_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_SIZE_BYTES = 5 * 1024 * 1024


def save_locataire_document(locataire_id: int, file: UploadFile, content: bytes) -> str:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Formats acceptés : PDF, PNG, JPG.")
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (5 Mo maximum).")

    filename = f"locataire_{locataire_id}_{uuid.uuid4().hex[:8]}{ext}"
    path = os.path.join(DOCUMENTS_DIR, filename)
    with open(path, "wb") as f:
        f.write(content)
    return os.path.relpath(path, STORAGE_ROOT).replace("\\", "/")
