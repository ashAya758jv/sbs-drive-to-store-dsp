"""Application settings, loaded from environment variables / a local .env file."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Application ---
    PROJECT_NAME: str = "SBS Data Factory — Drive-to-Store DSP API"
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"

    # --- Database (PostgreSQL-ready) ---
    # Not required while the API serves mock data; the engine is created lazily.
    DATABASE_URL: str = "postgresql+psycopg2://sbs:sbs@localhost:5432/sbs_dsp"

    # --- CORS ---
    # Comma-separated list of allowed origins (the Vite dev servers).
    # Kept as a plain string so a value from the env is never JSON-parsed by
    # pydantic-settings; use `cors_origins` for the parsed list.
    BACKEND_CORS_ORIGINS: str = (
        "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173"
    )

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.BACKEND_CORS_ORIGINS.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    """Cached accessor so settings are parsed once per process."""
    return Settings()


settings = get_settings()
