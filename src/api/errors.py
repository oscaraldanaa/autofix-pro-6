"""Traducción de errores de negocio a respuestas HTTP coherentes."""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.api.ports import OrdenNoEncontradaError, ReglaNegocioError


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(OrdenNoEncontradaError)
    async def _no_encontrada(_: Request, exc: OrdenNoEncontradaError) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={"codigo": "NO_ENCONTRADO", "detail": str(exc)},
        )

    @app.exception_handler(ReglaNegocioError)
    async def _regla(_: Request, exc: ReglaNegocioError) -> JSONResponse:
        return JSONResponse(
            status_code=409,
            content={"codigo": "REGLA_NEGOCIO", "regla": exc.regla, "detail": str(exc)},
        )
