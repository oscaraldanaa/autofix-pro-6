import uuid
from decimal import Decimal
import pytest

from src.domain.entities import Cliente, Vehiculo, Tecnico, CuentaFlotilla
from src.domain.value_objects import (
    ClienteId, VehiculoId, TecnicoId, CuentaFlotillaId,
    DatosContacto, Placas, Vin, Kilometraje, Porcentaje
)

from src.domain.entities.cuenta_flotilla import CondicionesFlotilla

from src.infrastructure.persistence.mappers import (
    cliente_a_record, record_a_cliente,
    vehiculo_a_record, record_a_vehiculo,
    tecnico_a_record, record_a_tecnico,
    cuenta_a_record, record_a_cuenta,
    _rehidratar
)


def test_cliente_mapper():
    """Valida el mapeo básico de Cliente."""
    cid = ClienteId(uuid.uuid4())
    cliente = _rehidratar(
            Cliente, 
            cid, 
            nombre="Juan Pérez", 
            contacto=DatosContacto("8111223344", "juan@test.com"), 
            cuenta_flotilla_id=CuentaFlotillaId(uuid.uuid4()),
            activo=True  # <-- Añadido aquí para que el mapper pueda leerlo
        )    
    
    # Forzamos el atributo público que el mapper busca directamente
    object.__setattr__(cliente, "activo", True)

    rec = cliente_a_record(cliente)
    assert rec.id == str(cid)
    assert rec.nombre == "Juan Pérez"

    restaurado = record_a_cliente(rec)
    assert restaurado.id == cid


def test_vehiculo_mapper():
    """Valida el mapeo básico de Vehículo."""
    vid = VehiculoId(uuid.uuid4())
    vehiculo = _rehidratar(Vehiculo, vid, placas=Placas("XYZ123"), marca="Ford", modelo="Focus", kilometraje=Kilometraje(50000), vin=None, cuenta_flotilla_id=CuentaFlotillaId(uuid.uuid4()))
    
    rec = vehiculo_a_record(vehiculo)
    assert rec.id == str(vid)
    assert rec.placas == "XYZ123"

    restaurado = record_a_vehiculo(rec)
    assert restaurado.id == vid


def test_tecnico_mapper():
    """Valida el mapeo básico de Técnico."""
    tid = TecnicoId(uuid.uuid4())
    tecnico = _rehidratar(Tecnico, tid, nombre="Carlos", especialidad="Motor", disponible=True)
    
    rec = tecnico_a_record(tecnico)
    assert rec.id == str(tid)
    assert rec.nombre == "Carlos"

    restaurado = record_a_tecnico(rec)
    assert restaurado.id == tid


def test_cuenta_flotilla_mapper():
    """Valida el mapeo básico de Cuenta Flotilla."""
    fid = CuentaFlotillaId(uuid.uuid4())
    auth_id = ClienteId(uuid.uuid4())
    cuenta = _rehidratar(CuentaFlotilla, fid, razon_social="Flotillas SA", autorizador_corporativo_id=auth_id, condiciones=CondicionesFlotilla(Porcentaje(Decimal("10.0")), 1, 15))
    
    rec = cuenta_a_record(cuenta)
    assert rec.id == str(fid)
    assert rec.razon_social == "Flotillas SA"

    restaurada = record_a_cuenta(rec)
    assert restaurada.id == fid