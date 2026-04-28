"""create_portal_sync_logs_table

Revision ID: aa25a45f7d0e
Revises: a0f5d577e345
Create Date: 2026-04-28 15:45:39.457291

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aa25a45f7d0e'
down_revision: Union[str, None] = 'add_perf_idx'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'portal_sync_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('firm_id', sa.UUID(), nullable=False),
        sa.Column('client_id', sa.UUID(), nullable=False),
        sa.Column('portal_type', sa.Enum('GST', 'MCA', 'Income Tax', 'Traces', 'Icegate', name='portaltype'), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', name='syncstatus'), nullable=True),
        sa.Column('sync_type', sa.String(), nullable=False),
        sa.Column('result_data', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('triggered_by', sa.UUID(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ),
        sa.ForeignKeyConstraint(['firm_id'], ['firms.id'], ),
        sa.ForeignKeyConstraint(['triggered_by'], ['users.id'], )
    )


def downgrade() -> None:
    op.drop_table('portal_sync_logs')
    # Note: Enums might need manual dropping if they are shared, but usually Postgres handles them if they are part of the table.
