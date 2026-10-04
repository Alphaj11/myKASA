"""add code_invitation to locataires

Revision ID: f8a9b0c1d2e3
Revises: e5f6a7b8c9d0
Create Date: 2026-10-04

"""
from alembic import op
import sqlalchemy as sa

revision = "f8a9b0c1d2e3"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("locataires", sa.Column("code_invitation", sa.String(20), nullable=True, unique=True))


def downgrade() -> None:
    op.drop_column("locataires", "code_invitation")
