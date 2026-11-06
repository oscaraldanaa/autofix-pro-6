"""Composition root de la API: construye el servicio real una sola vez."""
from functools import lru_cache

from src.api.ports import OrdenServicePort
from src.api.settings import get_settings


@lru_cache
def _build_service() -> OrdenServicePort:
    # Imports perezosos: las pruebas de API sustituyen get_orden_service
    # (app.dependency_overrides) y no necesitan DB ni dominio.
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from src.application.bootstrap import (  # ← ajustar (Fase 2/3)
        build_commands,
        build_queries,
    )

    from src.api.adapter import OrdenServiceAdapter

    engine = create_engine(get_settings().database_url, pool_pre_ping=True)
    session_factory = sessionmaker(engine, expire_on_commit=False)
    return OrdenServiceAdapter(
        commands=build_commands(session_factory),
        queries=build_queries(session_factory),
    )


def get_orden_service() -> OrdenServicePort:
    return _build_service()
