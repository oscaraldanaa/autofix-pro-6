"""Adaptador entre la API y la capa de aplicación real (Fases 1-3).

PUNTO ÚNICO DE INTEGRACIÓN: si los nombres de sus Handlers/Services difieren,
solo se ajusta este archivo. Traduce excepciones del dominio a las del puerto.
Supuestos: ver README, sección "Integración con las capas de las Fases 1-3".
"""
from contextlib import contextmanager
from typing import Any
from uuid import UUID

from src.api.ports import OrdenNoEncontradaError, ReglaNegocioError
from src.domain.exceptions import DomainError, EntityNotFoundError  # ← ajustar si difiere


@contextmanager
def _traducir_errores():
    try:
        yield
    except EntityNotFoundError as exc:
        raise OrdenNoEncontradaError(str(exc)) from exc
    except DomainError as exc:
        raise ReglaNegocioError(str(exc), getattr(exc, "regla", None)) from exc


class OrdenServiceAdapter:
    """Delegación 1:1 a los Application Services / Handlers (ADR-002 y ADR-004)."""

    def __init__(self, commands: Any, queries: Any):
        self._c = commands  # fachada de Commands (Application Services)
        self._q = queries   # fachada de Queries (Query Handlers)

    def registrar_ingreso(self, datos):
        with _traducir_errores():
            return self._c.registrar_ingreso_vehiculo(datos)

    def registrar_diagnostico(self, orden_id: UUID, datos):
        with _traducir_errores():
            return self._c.registrar_diagnostico(orden_id, datos)

    def generar_cotizacion(self, orden_id: UUID, datos):
        with _traducir_errores():
            return self._c.generar_cotizacion(orden_id, datos)

    def responder_cotizacion(self, orden_id: UUID, datos):
        with _traducir_errores():
            return self._c.responder_cotizacion(orden_id, datos)

    def asignar_trabajos(self, orden_id: UUID, datos):
        with _traducir_errores():
            return self._c.asignar_trabajos(orden_id, datos)

    def registrar_falla_adicional(self, orden_id: UUID, datos):
        with _traducir_errores():
            return self._c.registrar_falla_adicional(orden_id, datos)

    def modificar_fecha_entrega(self, orden_id: UUID, datos):
        with _traducir_errores():
            return self._c.modificar_fecha_entrega(orden_id, datos)

    def marcar_listo_entrega(self, orden_id: UUID):
        with _traducir_errores():
            return self._c.marcar_listo_entrega(orden_id)

    def registrar_cobro(self, orden_id: UUID, datos):
        with _traducir_errores():
            return self._c.registrar_cobro(orden_id, datos)

    def consultar_estado(self, orden_id: UUID):
        with _traducir_errores():
            return self._q.consultar_estado_orden(orden_id)

    def consultar_historial_vehiculo(self, placas: str):
        with _traducir_errores():
            return self._q.consultar_historial_vehiculo(placas)
