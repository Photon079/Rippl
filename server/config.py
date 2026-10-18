from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration loaded from environment / .env file."""

    FALKORDB_HOST: str = "localhost"
    FALKORDB_PORT: int = 6379
    FALKORDB_GRAPH: str = "rippl"

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = [".env", "server/.env", "../.env"]
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
