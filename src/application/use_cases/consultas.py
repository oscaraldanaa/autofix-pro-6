"""Casos de uso de lectura (CQRS ligero)."""
from __future__ import annotations

from ...domain.specifications import ContextoOperacion, beneficio_referencia, criterios, puede_procesarse
from ...domain.value_objects import OrdenServicioId, VehiculoId
from ..dto import (
    ClienteDTO, EvaluacionOperacionDTO, FlotillaDTO, OrdenDetalleDTO, OrdenListadoDTO, OrdenResumenDTO, TecnicoDTO,
    VehiculoDTO, a_orden_dto,
)
from .base import CasoDeUso


class ConsultarEstadoOrden(CasoDeUso):
    """US-12 / RF-12 / RN-02."""

    def ejecutar(self, orden_id: str) -> OrdenDetalleDTO:
        with self._uow_factory() as uow:
            return a_orden_dto(uow.ordenes.obtener(OrdenServicioId.desde_str(orden_id)))


class ConsultarHistorialVehiculo(CasoDeUso):
    def ejecutar(self, vehiculo_id: str) -> list[OrdenResumenDTO]:
        with self._uow_factory() as uow:
            vehiculo = uow.vehiculos.obtener(VehiculoId.desde_str(vehiculo_id))
            return [OrdenResumenDTO(str(o.id), o.estado.value, o.creada_en, o.datos_recepcion.motivo_ingreso)
                    for o in uow.ordenes.listar_por_vehiculo(vehiculo.id)]


class ListarOrdenes(CasoDeUso):
    """Tablero de órdenes (más recientes primero)."""

    def ejecutar(self) -> list[OrdenListadoDTO]:
        with self._uow_factory() as uow:
            return [OrdenListadoDTO(
                str(o.id), o.estado.value, str(o.cliente_id), str(o.vehiculo_id), o.creada_en,
                o.datos_recepcion.motivo_ingreso, o.es_flotilla,
                o.fecha_entrega.fecha_estimada if o.fecha_entrega else None, o.total_autorizado.monto)
                for o in uow.ordenes.listar()]


class ListarClientes(CasoDeUso):
    def ejecutar(self) -> list[ClienteDTO]:
        with self._uow_factory() as uow:
            return [ClienteDTO(str(c.id), c.nombre, c.contacto.telefono, c.contacto.email, c.activo,
                               c.es_preferente, str(c.cuenta_flotilla_id) if c.cuenta_flotilla_id else None)
                    for c in uow.clientes.listar()]


class ListarVehiculos(CasoDeUso):
    def ejecutar(self) -> list[VehiculoDTO]:
        with self._uow_factory() as uow:
            return [VehiculoDTO(str(v.id), v.placas.valor, v.marca, v.modelo, v.kilometraje.km,
                                v.vin.valor if v.vin else None,
                                str(v.cuenta_flotilla_id) if v.cuenta_flotilla_id else None)
                    for v in uow.vehiculos.listar()]


class ListarTecnicos(CasoDeUso):
    def ejecutar(self) -> list[TecnicoDTO]:
        with self._uow_factory() as uow:
            return [TecnicoDTO(str(t.id), t.nombre, t.especialidad, t.disponible) for t in uow.tecnicos.listar()]


class ListarFlotillas(CasoDeUso):
    def ejecutar(self) -> list[FlotillaDTO]:
        with self._uow_factory() as uow:
            return [FlotillaDTO(str(f.id), f.razon_social, str(f.autorizador_corporativo_id),
                                f.condiciones.descuento.valor, f.condiciones.prioridad, f.condiciones.dias_credito)
                    for f in uow.cuentas_flotilla.listar()]


class EvaluarOperacion(CasoDeUso):
    """Evalúa con Specifications compuestas (AND/OR/NOT) ``puede_procesarse`` y ``beneficio_referencia``."""

    def ejecutar(self, orden_id: str) -> EvaluacionOperacionDTO:
        with self._uow_factory() as uow:
            orden = uow.ordenes.obtener(OrdenServicioId.desde_str(orden_id))
            ctx = ContextoOperacion(uow.clientes.obtener(orden.cliente_id), orden)
            return EvaluacionOperacionDTO(
                orden_id=str(orden.id), cliente_id=str(orden.cliente_id), total_referencia=orden.total_referencia.monto,
                puede_procesarse=puede_procesarse().es_satisfecha_por(ctx),
                beneficio_referencia=beneficio_referencia().es_satisfecha_por(ctx), criterios=criterios(ctx))
