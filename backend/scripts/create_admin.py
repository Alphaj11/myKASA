"""Cree le premier compte administrateur.

Necessite que le schema soit a jour : executez `alembic upgrade head` au
prealable si la base est neuve.

Usage: python -m scripts.create_admin email@example.com "Nom Complet" motdepasse
"""
import sys

from app.db.session import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole


def main():
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(1)

    email, full_name, password = sys.argv[1], sys.argv[2], sys.argv[3]
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
