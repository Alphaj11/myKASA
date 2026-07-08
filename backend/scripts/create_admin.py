"""Cree le premier compte administrateur.

Usage: python -m scripts.create_admin email@example.com "Nom Complet" motdepasse
"""
import sys

from app.db.base import Base
from app.db.session import SessionLocal, engine
import app.models  # noqa: F401 -- ensures every model is registered on Base.metadata
from app.core.security import hash_password
from app.models.user import User, UserRole


def main():
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(1)

    email, full_name, password = sys.argv[1], sys.argv[2], sys.argv[3]
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == email).first():
            print(f"Un utilisateur avec l'email {email} existe deja.")
            sys.exit(1)
        admin = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(password),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        db.commit()
        print(f"Administrateur cree : {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
