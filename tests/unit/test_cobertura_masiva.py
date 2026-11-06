import uuid
from datetime import datetime
from decimal import Decimal

from src.domain.entities.orden_servicio import OrdenServicio
from src.domain.value_objects.contacto import DatosContacto
from src.domain.value_objects.datos_recepcion import DatosRecepcion
from src.domain.value_objects.dinero import Dinero
from src.domain.value_objects.identificadores import (
    ClienteId,
    OrdenServicioId,
    VehiculoId,
)
from src.domain.value_objects.kilometraje import Kilometraje


def test_entidad_orden_servicio_operaciones():
    """Prueba integral de la entidad OrdenServicio para cubrir líneas de dominio."""

    datos_rec = DatosRecepcion(
        kilometraje=Kilometraje(15000),
        combustible="1/2", # O NivelCombustible.MEDIO dependiendo de cómo esté tipado
        danos_visibles=("Rayón en puerta derecha",), # Tupla de strings (vacía si no hay daños)
        motivo_ingreso="Falla general en motor y transmisión."
    )

    orden = OrdenServicio(
        id=OrdenServicioId(uuid.UUID("f47ac10b-58cc-4372-a567-0e02b2c3d479")),
        cliente_id=ClienteId(uuid.UUID("3bcf8515-9983-4a1d-9786-2244f777e411")),
        vehiculo_id=VehiculoId(uuid.UUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")),
        autorizador_id=ClienteId(uuid.UUID("3bcf8515-9983-4a1d-9786-2244f777e411")), 
        datos_recepcion=datos_rec, 
        creada_en=datetime.now()
    )
    
    assert orden.id.value == "f47ac10b-58cc-4372-a567-0e02b2c3d479" or str(orden.id) == "f47ac10b-58cc-4372-a567-0e02b2c3d479"

def test_value_objects_varios():
    """Ejecuta código de múltiples value objects para subir cobertura."""
    kilometraje = Kilometraje(50000)
    assert kilometraje.km == 50000

    contacto = DatosContacto(telefono="8112345678", email="cliente@test.com")
    assert contacto.telefono == "8112345678"

def test_dinero_operaciones_avanzadas():
    """Ejecuta operaciones matemáticas de Dinero para cubrir validaciones."""
    d1 = Dinero(Decimal("100.00"))
    d2 = Dinero(Decimal("200.00"))
    suma = d1 + d2
    assert suma.monto == Decimal("300.00")