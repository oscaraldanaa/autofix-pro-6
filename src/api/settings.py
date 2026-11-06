"""Configuración por variables de entorno (12-Factor App, factor III)."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AutoFix Pro - API de Órdenes de Taller"
    app_version: str = "1.0.0"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://autofix:autofix@db:5432/autofix"
    root_path: str = ""  # útil si el despliegue está detrás de un proxy con prefijo


@lru_cache
def get_settings() -> Settings:
    return Settings()
