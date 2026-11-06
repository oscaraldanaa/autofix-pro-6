import pytest
import uuid
from src.domain.entities.cliente import Cliente
from src.domain.shared import ValorInvalido
from src.domain.value_objects import ClienteId, CuentaFlotillaId, DatosContacto


def test_cliente_init_y_propiedades():
    """Valida la inicialización correcta, propiedades y la excepción si el nombre es obligatorio."""
    cid = ClienteId(uuid.uuid4())
    contacto = DatosContacto("8112345678", "correo@test.com")
    fid = CuentaFlotillaId(uuid.uuid4())

    cliente = Cliente(cid, "  Juan Pérez  ", contacto, fid)
    
    assert cliente.id == cid
    assert cliente.nombre == "Juan Pérez"
    assert cliente.contacto == contacto
    assert cliente.cuenta_flotilla_id == fid
    assert cliente.es_corporativo is True

    # Valida excepción cuando el nombre está vacío o en blanco
    with pytest.raises(ValorInvalido, match="El nombre del cliente es obligatorio"):
        Cliente(cid, "   ", contacto)


def test_verificar_estatus_flotilla():
    """Valida el método verificar_estatus_flotilla para clientes corporativos y particulares."""
    cid = ClienteId(uuid.uuid4())
    contacto = DatosContacto("8111111111", "test@test.com")
    
    # Cliente corporativo (tiene cuenta flotilla)
    cliente_corporativo = Cliente(cid, "Empresa SA", contacto, CuentaFlotillaId(uuid.uuid4()))
    assert cliente_corporativo.verificar_estatus_flotilla() is True

    # Cliente particular (sin cuenta flotilla)
    cliente_particular = Cliente(cid, "Persona Normal", contacto, None)
    assert cliente_particular.verificar_estatus_flotilla() is False


def test_actualizar_contacto():
    """Valida el método actualizar_contacto."""
    cid = ClienteId(uuid.uuid4())
    contacto_inicial = DatosContacto("8111111111", "viejo@test.com")
    contacto_nuevo = DatosContacto("8222222222", "nuevo@test.com")
    
    cliente = Cliente(cid, "María López", contacto_inicial)
    assert cliente.contacto == contacto_inicial

    cliente.actualizar_contacto(contacto_nuevo)
    assert cliente.contacto == contacto_nuevo
