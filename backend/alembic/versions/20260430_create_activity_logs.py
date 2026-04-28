from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = 'create_act_logs'
down_revision = 'add_notif_fields'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'activity_logs',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('firm_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('firms.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('actor_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('entity_name', sa.String(length=255), nullable=True),
        sa.Column('details', sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    )

def downgrade():
    op.drop_table('activity_logs')
