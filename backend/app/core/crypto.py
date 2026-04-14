from cryptography.fernet import Fernet
from app.core.config import settings

fernet = Fernet(settings.FERNET_SECRET.encode())

def encrypt_string(plaintext: str) -> str:
    """Encrypts a plaintext string and returns the encrypted string."""
    return fernet.encrypt(plaintext.encode()).decode()

def decrypt_string(encrypted_text: str) -> str:
    """Decrypts an encrypted string and returns plaintext."""
    return fernet.decrypt(encrypted_text.encode()).decode()
