from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MotoRescue API"
    database_url: Optional[str] = None
    environment: str = "development"

    # Clerk Configuration
    clerk_secret_key: Optional[str] = None
    clerk_jwt_key: Optional[str] = None
    clerk_issuer: Optional[str] = None
    clerk_jwks_url: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
