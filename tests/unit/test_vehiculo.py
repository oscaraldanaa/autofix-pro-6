import pytest
import uuid
from src.domain.entities.vehiculo import Vehiculo
from src.domain.shared import ReglaDeNegocioViolada, ValorInvalido
from src.domain.value_objects import VehiculoId, Placas, Kilometraje, Vin, CuentaFlotillaId


def test_vehiculo_init_y_propiedades():
    """Valida la correcta inicialización, propiedades y la excepción si marca o modelo están vacíos."""
    vid = VehiculoId(uuid.uuid4())
    placas = Placas("ABC-123")
    km = Kilometraje(10000)
    vin = Vin("1HGCR2F83HA000000")
    fid = CuentaFlotillaId(uuid.uuid4())

    vehiculo = Vehiculo(vid, placas, "Nissan", "Sentra", km, vin, fid)
    
    assert vehiculo.id == vid
    assert vehiculo.placas == placas
    assert vehiculo.marca == "Nissan"
    assert vehiculo.modelo == "Sentra"
    assert vehiculo.kilometraje == km
    assert vehiculo.vin == vin
    assert vehiculo.cuenta_flotilla_id == fid
    assert vehiculo.es_de_flotilla is True

    # Valida la excepción si marca o modelo están vacíos
    with pytest.raises(ValorInvalido, match="Marca y modelo del vehículo son obligatorios"):
        Vehiculo(vid, placas, "   ", "Sentra", km)


def test_vehiculo_es_de_flotilla_falso():
    """Valida que la propiedad es_de_flotilla sea False cuando no cuenta con cuenta_flotilla_id."""
    vehiculo = Vehiculo(
        VehiculoId(uuid.uuid4()),
        Placas("XYZ-789"),
        "Ford",
        "Focus",
        Kilometraje(5000),
        None,
        None
    )
    assert vehiculo.es_de_flotilla is False


def test_actualizar_kilometraje():
    """Valida la actualización correcta del kilometraje y la regla de negocio si este disminuye."""
    vehiculo = Vehiculo(
        VehiculoId(uuid.uuid4()),
        Placas("ABC-123"),
        "Chevrolet",
        "Aveo",
        Kilometraje(20000),
        None,
        None
    )
    
    # Actualización exitosa con mayor kilometraje
    nuevo_km = Kilometraje(22000)
    vehiculo.actualizar_kilometraje(nuevo_km)
    assert vehiculo.kilometraje == nuevo_km

    # Intento de disminuir el kilometraje debe lanzar ReglaDeNegocioViolada (RN-01)
    with pytest.raises(ReglaDeNegocioViolada, match="El kilometraje no puede disminuir"):
        vehiculo.actualizar_kilometraje(Kilometraje(15000))