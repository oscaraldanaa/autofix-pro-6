import pytest
import uuid
from datetime import datetime
from src.domain.entities.orden_servicio import OrdenServicio
from src.domain.value_objects import (
    OrdenServicioId, ClienteId, VehiculoId, DatosRecepcion, NivelCombustible,
    Kilometraje, SolicitudRefaccionId, ConceptoId, TecnicoId
)
from src.domain.shared import ValorInvalido, ReglaDeNegocioViolada
from src.domain.value_objects.estado_orden import EstadoOrden
from src.domain.entities.solicitudes import SolicitudRefaccion
from src.domain.entities.solicitudes import SolicitudAmpliacion, EstadoAmpliacion

def test_registrar_diagnostico_sin_hallazgos():
    """Cubre las líneas 79-89 (específicamente la validación de hallazgos vacíos en registrar_diagnostico)."""
    datos = DatosRecepcion(Kilometraje(1000), NivelCombustible("lleno"), (), "Revisión")
    orden = OrdenServicio(
        OrdenServicioId.generar(), ClienteId.generar(), VehiculoId.generar(),
        ClienteId.generar(), datos, datetime.now()
    )
    
    # Valida que falle si no se envían hallazgos válidos
    with pytest.raises(ValorInvalido, match="El diagnóstico requiere al menos un hallazgo"):
        orden.registrar_diagnostico(TecnicoId.generar(), ["   ", ""])


def test_actualizar_reposicion_motivo_vacio():
    """Cubre las líneas 132-138 (método actualizar_reposicion y su validación de motivo obligatorio)."""
    datos = DatosRecepcion(Kilometraje(1000), NivelCombustible("lleno"), (), "Revisión")
    orden = OrdenServicio(
        OrdenServicioId.generar(), ClienteId.generar(), VehiculoId.generar(),
        ClienteId.generar(), datos, datetime.now()
    )
    orden._estado = EstadoOrden.EN_ESPERA_REFACCION
    
    sol_id = SolicitudRefaccionId.generar()
    orden._solicitudes_refaccion.append(
        SolicitudRefaccion(sol_id, ConceptoId.generar(), "Filtro", datetime.now())
    )
    
    # Valida que falle si el motivo está vacío o solo contiene espacios
    with pytest.raises(ValorInvalido, match="RN-03: el motivo del retraso es obligatorio"):
        orden.actualizar_reposicion(sol_id, datetime.now(), "   ")


def test_recibir_refaccion():
    """Cubre las líneas 143-148 (método recibir_refaccion y el cambio de estado a EN_REPARACION)."""
    datos = DatosRecepcion(Kilometraje(1000), NivelCombustible("lleno"), (), "Revisión")
    orden = OrdenServicio(
        OrdenServicioId.generar(), ClienteId.generar(), VehiculoId.generar(),
        ClienteId.generar(), datos, datetime.now()
    )
    orden._estado = EstadoOrden.EN_ESPERA_REFACCION
    
    sol_id = SolicitudRefaccionId.generar()
    solicitud = SolicitudRefaccion(sol_id, ConceptoId.generar(), "Filtro", datetime.now())
    orden._solicitudes_refaccion.append(solicitud)
    
    # Ejecuta la recepción de la refacción
    orden.recibir_refaccion(sol_id)
    
    # Verifica que la solicitud ya no esté pendiente y el estado de la orden cambie a en reparación
    assert not solicitud.pendiente
    assert orden.estado == EstadoOrden.EN_REPARACION

def test_registrar_falla_adicional_descripcion_vacia():
    """Cubre las líneas 152-164 (método registrar_falla_adicional y validación de descripción obligatoria)."""
    datos = DatosRecepcion(Kilometraje(1000), NivelCombustible("lleno"), (), "Revisión")
    orden = OrdenServicio(
        OrdenServicioId.generar(), ClienteId.generar(), VehiculoId.generar(),
        ClienteId.generar(), datos, datetime.now()
    )
    orden._estado = EstadoOrden.EN_REPARACION
    
    # Valida que falle si la descripción está vacía o en blancos
    with pytest.raises(ValorInvalido, match="La descripción de la falla adicional es obligatoria"):
        orden.registrar_falla_adicional(TecnicoId.generar(), "   ")

