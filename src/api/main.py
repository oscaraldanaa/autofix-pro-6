"""Punto de entrada FastAPI. Swagger UI en /docs, OpenAPI en /openapi.json."""
from fastapi import FastAPI

from src.api.errors import register_error_handlers
from src.api.routers_ordenes import router as ordenes_router
from src.api.settings import get_settings

DESCRIPCION = """
API del **Sistema de Gestión y Trazabilidad Operativa de AutoFix Pro**.

Expone el ciclo de vida de la *Orden de Servicio*:
`Recibido → Diagnosticado → Cotizado → Autorizado → En reparación → Listo para entrega → Cerrado`.

Las reglas de negocio (RN-xx) viven en el dominio; esta capa sólo valida el formato
de entrada y traduce errores: **404** (no existe), **409** (regla de negocio violada),
**422** (datos mal formados).
"""


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=DESCRIPCION,
        root_path=settings.root_path,
        openapi_tags=[{"name": "Órdenes de taller", "description": "Casos de uso CU-01 a CU-05"},
                      {"name": "Sistema", "description": "Salud del servicio"}],
    )
    register_error_handlers(app)
    app.include_router(ordenes_router)

    @app.get("/health", tags=["Sistema"], summary="Health check")
    def health() -> dict[str, str]:
        return {"status": "ok", "environment": settings.environment}

    return app


app = create_app()
