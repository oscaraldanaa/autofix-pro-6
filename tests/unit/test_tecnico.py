import pytest
import uuid
from src.domain.entities.tecnico import Tecnico
from src.domain.shared import ReglaDeNegocioViolada, ValorInvalido
from src.domain.value_objects import TecnicoId


def test_tecnico_init_exitoso_y_nombre_vacio():
    """Valida la correcta inicialización y la excepción si el nombre es obligatorio y viene vacío."""
    tid = TecnicoId(uuid.uuid4())
    tecnico = Tecnico(tid, "Carlos Pérez", "Motor", disponible=True)
    
    assert tecnico.id == tid
    assert tecnico.nombre == "Carlos Pérez"
    assert tecnico.especialidad == "Motor"
    assert tecnico.disponible is True

    # Valida la excepción del __init__ cuando el nombre está vacío
    with pytest.raises(ValorInvalido, match="El nombre del técnico es obligatorio"):
        Tecnico(tid, "   ", "Motor")


def test_tecnico_asignar():
    """Valida el método asignar (cambia disponibilidad a False) y su regla de negocio si ya está ocupado."""
    tid = TecnicoId(uuid.uuid4())
    tecnico = Tecnico(tid, "Ana Gómez", "Electricidad", disponible=True)
    
    # Asigna al técnico por primera vez
    tecnico.asignar()
    assert tecnico.disponible is False

    # Intenta asignar de nuevo y debe lanzar ReglaDeNegocioViolada (RN-12)
    with pytest.raises(ReglaDeNegocioViolada, match="El técnico no está disponible"):
        tecnico.asignar()


def test_tecnico_liberar():
    """Valida el método liberar (restaura la disponibilidad a True)."""
    tid = TecnicoId(uuid.uuid4())
    tecnico = Tecnico(tid, "Luis Torres", "Suspensión", disponible=False)
    
    assert tecnico.disponible is False
    
    # Libera al técnico
    tecnico.liberar()
    assert tecnico.disponible is True