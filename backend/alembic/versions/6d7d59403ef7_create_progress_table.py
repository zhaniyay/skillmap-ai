"""create progress table

Revision ID: 6d7d59403ef7
Revises: 
Create Date: 2025-07-25 13:53:44.612234

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6d7d59403ef7'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('user',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('username', sa.String(), nullable=False),
    sa.Column('hashed_password', sa.String(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('progress',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.String(), nullable=False),
    sa.Column('goal', sa.String(), nullable=False),
    sa.Column('skills', sa.JSON(), nullable=True),
    sa.Column('roadmap', sa.JSON(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('progress')
    op.drop_table('user')
    # ### end Alembic commands ###
