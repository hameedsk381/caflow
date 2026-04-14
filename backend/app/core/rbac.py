from typing import List

# Define generic permissions
class Permissions:
    READ_CLIENTS = "read:clients"
    WRITE_CLIENTS = "write:clients"
    READ_TASKS = "read:tasks"
    WRITE_TASKS = "write:tasks"
    MANAGE_TEAM = "manage:team"
    MANAGE_FIRM = "manage:firm"
    MANAGE_BILLING = "manage:billing"
    READ_VAULT = "read:vault"
    WRITE_VAULT = "write:vault"

# Role to permissions mapping
ROLE_PERMISSIONS = {
    "firm_admin": [
        Permissions.READ_CLIENTS, Permissions.WRITE_CLIENTS,
        Permissions.READ_TASKS, Permissions.WRITE_TASKS,
        Permissions.MANAGE_TEAM, Permissions.MANAGE_FIRM,
        Permissions.MANAGE_BILLING,
        Permissions.READ_VAULT, Permissions.WRITE_VAULT
    ],
    "employee": [
        Permissions.READ_CLIENTS,
        Permissions.READ_TASKS, Permissions.WRITE_TASKS,
    ],
    "tax_consultant": [
        Permissions.READ_CLIENTS,
        Permissions.READ_TASKS, Permissions.WRITE_TASKS,
    ],
    "client_user": [
        Permissions.READ_TASKS
    ]
}

def has_permission(role: str, permission: str) -> bool:
    permissions = ROLE_PERMISSIONS.get(role, [])
    return permission in permissions

def get_roles_with_permission(permission: str) -> List[str]:
    return [role for role, perms in ROLE_PERMISSIONS.items() if permission in perms]
