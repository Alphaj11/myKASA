"""add_code_locataire

Revision ID: c3d4e5f6a7b8
Revises: 7a3a40ef9bf3
Create Date: 2026-08-11 00:00:00.000000

"""
import random
import string
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "7a3a40ef9bf3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_CHARS = string.ascii_uppercase + string.digits


def _random_code(used: set) -> str:
    while True:
        code = "".join(random.choices(_CHARS, k=6))
        if code not in used:
            used.add(code)
            return code


def upgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("code_locataire", sa.String(length=10), nullable=True))

    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id FROM users")).fetchall()
    used: set = set()
    for (user_id,) in rows:
        code = _random_code(used)
        conn.execute(
            sa.text("UPDATE users SET code_locataire = :code WHERE id = :uid"),
            {"code": code, "uid": user_id},
        )

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.create_index("ix_users_code_locataire", ["code_locataire"], unique=True)


def downgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_index("ix_users_code_locataire")
        batch_op.drop_column("code_locataire")
