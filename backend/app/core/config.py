from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "CAFlow"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    SECRET_KEY: str = "changethis-in-production-must-be-32-chars-minimum"
    FERNET_SECRET: str = "P8r3c5kG9P_5a7qR1jF9s6dH3mY6bV8pS4eX2wH1bTQ=" # Fallback testing key (generate via cryptography.fernet import Fernet; Fernet.generate_key().decode())
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = "postgresql+asyncpg://caflow:caflow123@localhost:5432/caflow"
    DATABASE_URL_SYNC: str = "postgresql://caflow:caflow123@localhost:5432/caflow"

    REDIS_URL: str = "redis://localhost:6379/0"

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-south-1"
    AWS_S3_BUCKET: str = "caflow-documents"

    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM: str = "noreply@caflow.in"

    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = ""  # e.g. whatsapp:+14155238886

    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = "noreply@caflow.in"

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
