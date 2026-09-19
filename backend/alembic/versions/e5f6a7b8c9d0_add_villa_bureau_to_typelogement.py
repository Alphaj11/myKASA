"""add VILLA and BUREAU to typelogement enum

Revision ID: e5f6a7b8c9d0
Revises: d1e2f3a4b5c6
Create Date: 2026-09-19

"""
from alembic import op

revision = "e5f6a7b8c9d0"
down_revision = "d1e2f3a4b5c6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE typelogement ADD VALUE IF NOT EXISTS 'VILLA'")
    op.execute("ALTER TYPE typelogement ADD VALUE IF NOT EXISTS 'BUREAU'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; downgrade is a no-op
    pass
