import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/qits_db"
    JWT_SECRET: str = "qits_secret_key_change_me_in_production_1234567890"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:3000,https://qitsassetmanagement.vercel.app,https://qits-asset-management.vercel.app"
    
    # Microsoft 365 / Outlook (Microsoft Graph API) Configuration
    AZURE_TENANT_ID: str = ""
    AZURE_CLIENT_ID: str = ""
    AZURE_CLIENT_SECRET: str = ""
    SENDER_EMAIL: str = ""

    # Optional / Fallback SMTP Email Configuration
    SMTP_HOST: str = "smtp.office365.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    EMAILS_ENABLED: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        return [i.strip() for i in self.CORS_ORIGINS.split(",") if i.strip()]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
