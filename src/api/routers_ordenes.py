"""Endpoints REST de órdenes de taller. Sin lógica de negocio (ADR-004)."""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status

from src.api import schemas as s
from src.api.dependencies import get_orden_service
from src.api.ports import OrdenServicePort

Service = Annotated[OrdenServicePort, Depends(get_orden_service)]

router = APIRouter(
    prefix="/api/v1",
    tags=["Órdenes de taller"],
    responses={
        404: {"model": s.ErrorOut, "description": "Orden o vehículo no encontrado"},
        409: {"model": s.ErrorOut, "description": "Regla de negocio o transición de estado violada"},
    },
)


def _datos(modelo) -> dict:
    return modelo.model_dump(mode="python")


@router.post(
    "/ordenes",
    response_model=s.OrdenOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar ingreso del vehículo (US-01, RN-01)",
    description="Abre la Orden de Trabajo en estado **Recibido**. Si el cliente pertenece a "
    "una flotilla, la orden se asocia automáticamente (US-17, RN-09).",
)
def registrar_ingreso(body: s.IngresoIn, svc: Service):
    return svc.registrar_ingreso(_datos(body))


@router.get(
    "/ordenes/{orden_id}",
    response_model=s.OrdenOut,
    summary="Consultar estado de la orden (US-12, RN-02)",
)
def consultar_estado(orden_id: UUID, svc: Service):
    return svc.consultar_estado(orden_id)


@router.get(
    "/vehiculos/{placas}/historial",
    response_model=list[s.OrdenOut],
    summary="Historial de órdenes de un vehículo",
)
def historial_vehiculo(placas: str, svc: Service):
    return svc.consultar_historial_vehiculo(placas)


@router.post(
    "/ordenes/{orden_id}/diagnostico",
    response_model=s.OrdenOut,
    summary="Registrar diagnóstico técnico (US-02) → Diagnosticado",
)
def registrar_diagnostico(orden_id: UUID, body: s.DiagnosticoIn, svc: Service):
    return svc.registrar_diagnostico(orden_id, _datos(body))


@router.post(
    "/ordenes/{orden_id}/cotizacion",
    response_model=s.OrdenOut,
    status_code=status.HTTP_201_CREATED,
    summary="Generar cotización (US-03, RN-05) → Cotizado",
)
def generar_cotizacion(orden_id: UUID, body: s.CotizacionIn, svc: Service):
    return svc.generar_cotizacion(orden_id, _datos(body))


@router.post(
    "/ordenes/{orden_id}/cotizacion/respuesta",
    response_model=s.OrdenOut,
    summary="Autorizar o rechazar cotización, total o parcial (US-04, RN-05/10/11)",
    description="Registra la decisión por concepto con **timestamp e IP** del cliente "
    "(RN-11). Los conceptos rechazados se excluyen y se recalcula el total.",
)
def responder_cotizacion(orden_id: UUID, body: s.RespuestaCotizacionIn, request: Request, svc: Service):
    datos = _datos(body)
    datos["ip_origen"] = request.client.host if request.client else None
    return svc.responder_cotizacion(orden_id, datos)


@router.post(
    "/ordenes/{orden_id}/asignacion",
    response_model=s.OrdenOut,
    summary="Asignar trabajos autorizados al técnico (US-05, RN-13) → En reparación",
)
def asignar_trabajos(orden_id: UUID, body: s.AsignacionIn, svc: Service):
    return svc.asignar_trabajos(orden_id, _datos(body))


@router.post(
    "/ordenes/{orden_id}/fallas-adicionales",
    response_model=s.OrdenOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar falla adicional (US-08, RN-04)",
)
def registrar_falla_adicional(orden_id: UUID, body: s.FallaAdicionalIn, svc: Service):
    return svc.registrar_falla_adicional(orden_id, _datos(body))


@router.put(
    "/ordenes/{orden_id}/fecha-entrega",
    response_model=s.OrdenOut,
    summary="Modificar fecha estimada de entrega (US-11, RN-06)",
)
def modificar_fecha_entrega(orden_id: UUID, body: s.FechaEntregaIn, svc: Service):
    return svc.modificar_fecha_entrega(orden_id, _datos(body))


@router.post(
    "/ordenes/{orden_id}/listo-entrega",
    response_model=s.OrdenOut,
    summary="Marcar orden lista para entrega (US-14) → Listo para entrega",
)
def marcar_listo_entrega(orden_id: UUID, svc: Service):
    return svc.marcar_listo_entrega(orden_id)


@router.post(
    "/ordenes/{orden_id}/cobro",
    response_model=s.OrdenOut,
    summary="Registrar cobro y cerrar la orden (US-15) → Cerrada",
)
def registrar_cobro(orden_id: UUID, body: s.CobroIn, svc: Service):
    return svc.registrar_cobro(orden_id, _datos(body))
