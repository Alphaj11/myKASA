import os
import uuid

from fastapi import HTTPException, UploadFile

from app.services.pdf import STORAGE_ROOT

IMAGES_DIR = os.path.join(STORAGE_ROOT, "images")

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_SIZE_BYTES = 10 * 1024 * 1024


def save_image(subfolder: str, file: UploadFile, content: bytes) -> str:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Formats acceptés : PNG, JPG, JPEG, WEBP.")
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image trop volumineuse (10 Mo maximum).")

    folder = os.path.join(IMAGES_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(folder, filename)
    with open(path, "wb") as f:
        f.write(content)

    return f"/static/images/{subfolder}/{filename}"


def delete_image(url: str | None) -> None:
    if not url or not url.startswith("/static/images/"):
        return
    relative = url.removeprefix("/static/images/")
    full_path = os.path.join(IMAGES_DIR, relative)
    if os.path.exists(full_path):
        os.remove(full_path)
