"""create_metrics_snapshots_table

Revision ID: 4f8c07d683d5
Revises: a0f5d577e345
Create Date: 2026-04-28 15:48:19.399091

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4f8c07d683d5'
down_revision: Union[str, None] = 'a0f5d577e345'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'metrics_snapshots',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('firm_id', sa.UUID(), nullable=False),
        sa.Column('snapshot_date', sa.Date(), nullable=False),
        sa.Column('total_revenue', sa.Float(), nullable=True),
        sa.Column('outstanding_amount', sa.Float(), nullable=True),
        sa.Column('total_clients', sa.Integer(), nullable=True),
        sa.Column('filing_rate', sa.Float(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['firm_id'], ['firms.id'], ondelete='CASCADE')
    )
    op.create_index('ix_metrics_snapshots_firm_id', 'metrics_snapshots', ['firm_id'], unique=False)
    op.create_index('ix_metrics_snapshots_snapshot_date', 'metrics_snapshots', ['snapshot_date'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_metrics_snapshots_snapshot_date', table_name='metrics_snapshots')
    op.drop_index('ix_metrics_snapshots_firm_id', table_name='metrics_snapshots')
    op.drop_table('metrics_snapshots')
