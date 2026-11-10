"""Aplicación FastAPI. Ejecutar: ``uvicorn src.api.main:app``."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from ..infrastructure.bootstrap import Contenedor, crear_contenedor
from ..infrastructure.config import load_settings
from .errores import registrar_manejadores
from .routers import catalogos, ordenes, salud

WEB_DIR = Path(__file__).resolve().parent / "web"

DESCRIPCION = """
API del **Sistema de Gestión y Trazabilidad Operativa de AutoFix Pro** (PIA — Componentes de Lógica de Negocio, FIME-UANL).

### Cómo probar desde Swagger
1. Pulsa **Authorize** e ingresa un rol (`X-Rol`): `cliente`, `asesor_servicio`, `tecnico`, `compras` o `caja` (RN-12).
2. Sigue el ciclo: ingreso → diagnóstico → cotización → respuesta del cliente → asignación → … → cobro.

### Ciclo de vida de la orden
`Recibido → Diagnosticado → Cotizado → Autorizado → En reparación ⇄ En espera de refacción → Listo para entrega → Cerrado`
(o `Cancelado`). Las transiciones inválidas responden **409**.

### Códigos de error
401/403 rol · 404 no existe · 409 regla de negocio o transición inválida · 422 dato inválido.
"""

TAGS = [
    {"name": "Órdenes de servicio", "description": "Ciclo de vida de la OT (US-01 a US-15)."},
    {"name": "Catálogos", "description": "Clientes, vehículos, técnicos y cuentas de flotilla."},
    {"name": "Salud", "description": "Verificación del servicio."},
]


def crear_app(contenedor: Contenedor | None = None) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        propio = contenedor is None
        if propio:
            settings = load_settings()
            logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
            app.state.contenedor = crear_contenedor(settings)
        yield
        if propio:
            app.state.contenedor.engine.dispose()

    app = FastAPI(title="AutoFix Pro API", version="1.0.0", description=DESCRIPCION, openapi_tags=TAGS,
                  lifespan=lifespan, docs_url="/docs", redoc_url="/redoc")
    if contenedor is not None:
        app.state.contenedor = contenedor
    registrar_manejadores(app)
    app.include_router(salud.router)
    app.include_router(catalogos.router)
    app.include_router(ordenes.router)

    # Interfaz web (sin build): HTML/CSS/JS estáticos servidos por la misma API, así no hay CORS que configurar.
    app.mount("/web", StaticFiles(directory=WEB_DIR), name="web")

    @app.get("/", response_class=HTMLResponse, include_in_schema=False)
    def leer_raiz():
        return (WEB_DIR / "index.html").read_text(encoding="utf-8")

    return app



app = crear_app()
