from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    jwt_secret: str = Field(...)
    jwt_expires_hours: int = 24

    sqlite_path: str = "./data/auth.db"

    smtp_host: str = "smtp.all-inkl.com"
    smtp_port: int = 587
    smtp_user: str = Field(...)
    smtp_pass: str = Field(...)
    smtp_from: str = "Nina Learns Vibe Coding <ciao@ninalearnsvibecoding.com>"

    allowed_origin: str = "https://ninalearnsvibecoding.com"

    rate_limit_per_email: int = 3
    rate_limit_window_min: int = 10
    code_ttl_minutes: int = 10
    code_max_attempts: int = 5

    consent_version: str = "1.0"


def get_settings() -> Settings:
    return Settings()
