import contextvars
from typing import Optional

# Define ContextVars to hold the current tenant (firm_id) and user (actor_id)
_tenant_id_ctx_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "tenant_id", default=None
)
_actor_id_ctx_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "actor_id", default=None
)

def set_tenant_context(tenant_id: str, actor_id: str):
    """Sets the multitenant context."""
    _tenant_id_ctx_var.set(tenant_id)
    _actor_id_ctx_var.set(actor_id)

def get_tenant_id() -> Optional[str]:
    return _tenant_id_ctx_var.get()

def get_actor_id() -> Optional[str]:
    return _actor_id_ctx_var.get()
