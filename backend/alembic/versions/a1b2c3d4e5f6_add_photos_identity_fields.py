"""add photos, identity fields, immeuble verification

Revision ID: a1b2c3d4e5f6
Revises: 3b75e1a4c60e
Create Date: 2026-07-25 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "3b75e1a4c60e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("avatar_url", sa.String(500), nullable=True))
        batch_op.add_column(sa.Column("date_naissance", sa.Date(), nullable=True))
        batch_op.add_column(sa.Column("adresse", sa.String(500), nullable=True))
        batch_op.add_column(sa.Column("cni_numero", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("cni_url", sa.String(500), nullable=True))

    with op.batch_alter_table("immeubles", schema=None) as batch_op:
        batch_op.add_column(sa.Column("description", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("type_bien", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("superficie_totale", sa.Numeric(10, 2), nullable=True))
        batch_op.add_column(sa.Column("annee_construction", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("photo_principale_url", sa.String(500), nullable=True))
        batch_op.add_column(sa.Column("verification_level", sa.Integer(), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("declaration_acceptee", sa.Boolean(), nullable=False, server_default="0"))

    with op.batch_alter_table("logements", schema=None) as batch_op:
        batch_op.add_column(sa.Column("description", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("superficie", sa.Numeric(10, 2), nullable=True))
        batch_op.add_column(sa.Column("etage", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("nb_chambres", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("nb_salles_de_bain", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("meuble", sa.Boolean(), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("photo_principale_url", sa.String(500), nullable=True))

    # TypeLogement enum: add VILLA and BUREAU values (SQLite: just text, no-op needed)

    with op.batch_alter_table("locataires", schema=None) as batch_op:
        batch_op.add_column(sa.Column("date_naissance", sa.Date(), nullable=True))
        batch_op.add_column(sa.Column("adresse", sa.String(500), nullable=True))
        batch_op.add_column(sa.Column("cni_numero", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("photo_url", sa.String(500), nullable=True))
        batch_op.add_column(sa.Column("profession", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("employeur", sa.String(255), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("locataires", schema=None) as batch_op:
        batch_op.drop_column("employeur")
        batch_op.drop_column("profession")
        batch_op.drop_column("photo_url")
        batch_op.drop_column("cni_numero")
        batch_op.drop_column("adresse")
        batch_op.drop_column("date_naissance")

    with op.batch_alter_table("logements", schema=None) as batch_op:
        batch_op.drop_column("photo_principale_url")
        batch_op.drop_column("meuble")
        batch_op.drop_column("nb_salles_de_bain")
        batch_op.drop_column("nb_chambres")
        batch_op.drop_column("etage")
        batch_op.drop_column("superficie")
        batch_op.drop_column("description")

    with op.batch_alter_table("immeubles", schema=None) as batch_op:
        batch_op.drop_column("declaration_acceptee")
        batch_op.drop_column("verification_level")
        batch_op.drop_column("photo_principale_url")
        batch_op.drop_column("annee_construction")
        batch_op.drop_column("superficie_totale")
        batch_op.drop_column("type_bien")
        batch_op.drop_column("description")

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("cni_url")
        batch_op.drop_column("cni_numero")
        batch_op.drop_column("adresse")
        batch_op.drop_column("date_naissance")
        batch_op.drop_column("avatar_url")
