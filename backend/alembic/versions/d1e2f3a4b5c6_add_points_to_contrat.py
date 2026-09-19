"""add points to contrat

Revision ID: d1e2f3a4b5c6
Revises: c3d4e5f6a7b8
Create Date: 2026-08-11

"""
from alembic import op
import sqlalchemy as sa

revision = "d1e2f3a4b5c6"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("contrats", sa.Column("points_cumules", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("contrats", sa.Column("points_disponibles", sa.Integer(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("contrats", "points_disponibles")
    op.drop_column("contrats", "points_cumules")
