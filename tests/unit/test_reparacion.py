import pytest
import uuid
from src.domain.entities.trabajo_reparacion import TrabajoReparacion, EstadoTrabajo
from src.domain.value_objects import TrabajoId, ConceptoId, TecnicoId


def test_trabajo_reparacion_init():
    """Valida la correcta inicialización y propiedades por defecto del trabajo."""
    tid = TrabajoId(uuid.uuid4())
    cid = ConceptoId(uuid.uuid4())
    tec_id = TecnicoId(uuid.uuid4())
    
    trabajo = TrabajoReparacion(tid, cid, "Reparación de motor", tec_id)
    
    assert trabajo.id == tid
    assert trabajo.concepto_id == cid
    assert trabajo.descripcion == "Reparación de motor"
    assert trabajo.tecnico_id == tec_id
    assert trabajo.estado == EstadoTrabajo.EN_REPARACION


def test_trabajo_reparacion_finalizar():
    """Valida que el método finalizar cambie el estado de EN_REPARACION a PENDIENTE_REVISION."""
    trabajo = TrabajoReparacion(
        TrabajoId(uuid.uuid4()), 
        ConceptoId(uuid.uuid4()), 
        "Cambio de balatas", 
        TecnicoId(uuid.uuid4())
    )
    
    assert trabajo.estado == EstadoTrabajo.EN_REPARACION
    trabajo.finalizar()
    assert trabajo.estado == EstadoTrabajo.PENDIENTE_REVISION


def test_trabajo_reparacion_aprobar_revision():
    """Valida que el método aprobar_revision cambie el estado de PENDIENTE_REVISION a REVISADO."""
    trabajo = TrabajoReparacion(
        TrabajoId(uuid.uuid4()), 
        ConceptoId(uuid.uuid4()), 
        "Alineación y balanceo", 
        TecnicoId(uuid.uuid4())
    )
    
    # Primero se finaliza para pasar a pendiente de revisión
    trabajo.finalizar()
    assert trabajo.estado == EstadoTrabajo.PENDIENTE_REVISION
    
    # Luego se aprueba la revisión
    trabajo.aprobar_revision()
    assert trabajo.estado == EstadoTrabajo.REVISADO