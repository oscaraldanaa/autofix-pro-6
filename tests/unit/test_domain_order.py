import pytest
import uuid
from decimal import Decimal
from src.domain.value_objects.dinero import Dinero
from src.domain.value_objects.estado_orden import EstadoOrden
from src.domain.state_machine.orden_state_machine import ORDEN_STATE_MACHINE, DisparadorOrden
from src.domain.state_machine.base import TransicionInvalida
from src.domain.value_objects.dinero import Dinero
from src.domain.shared import ValorInvalido

def test_transicion_estado_valida():
    """Valida la transición de RECIBIDO a DIAGNOSTICADO usando el disparador DIAGNOSTICAR."""
    estado_siguiente = ORDEN_STATE_MACHINE.destino(
        EstadoOrden.RECIBIDO, 
        DisparadorOrden.DIAGNOSTICAR
    )
    assert estado_siguiente == EstadoOrden.DIAGNOSTICADO


def test_transicion_estado_invalida():
    """Valida que intentar pasar de RECIBIDO a CERRADO directamente lance una excepción de Transición Inválida."""
    with pytest.raises((TransicionInvalida, Exception)):
        ORDEN_STATE_MACHINE.destino(
            EstadoOrden.RECIBIDO, 
            DisparadorOrden.CERRAR
        )


def test_value_object_dinero():
    """Verifica las operaciones aritméticas y validaciones del Value Object Dinero."""
    monto_a = Dinero(Decimal("1500.00"))
    monto_b = Dinero(Decimal("500.00"))
    
    total = monto_a + monto_b
    assert total.monto == Decimal("2000.00")


def test_value_object_dinero_resta():
    """Verifica la operación de resta en el Value Object Dinero."""
    monto_a = Dinero(Decimal("1500.00"))
    monto_b = Dinero(Decimal("500.00"))
    
    diferencia = monto_a - monto_b
    assert diferencia.monto == Decimal("1000.00")


def test_value_object_dinero_igualdad():
    """Verifica que dos instancias de Dinero con el mismo monto sean consideradas iguales."""
    monto_a = Dinero(Decimal("750.50"))
    monto_b = Dinero(Decimal("750.50"))
    
    assert monto_a == monto_b

def test_dinero_post_init_rechaza_float_y_bool():
    """Valida que __post_init__ rechace explícitamente tipos float y booleans."""
    with pytest.raises(ValorInvalido, match="Dinero no admite float"):
        Dinero(100.50)  # Pasa un float directamente

    with pytest.raises(ValorInvalido):
        Dinero(Decimal("100.00"), moneda=True)  # Pasa un bool como moneda


def test_dinero_post_init_cuantizacion_y_mayusculas():
    """Valida que __post_init__ ajuste a centavos y convierta la moneda a mayúsculas."""
    dinero = Dinero(Decimal("123.456"), moneda="usd")
    assert dinero.monto == Decimal("123.46")  # Cuantizado a centavos
    assert dinero.moneda == "USD"            # Convertido a mayúsculas


def test_validar_monto_negativo():
    """Valida que _validar lance una excepción si el monto es menor a 0."""
    with pytest.raises(ValorInvalido, match="El importe no puede ser negativo"):
        Dinero(Decimal("-5.00"))


def test_validar_moneda_formato_incorrecto():
    """Valida que _validar rechace códigos de moneda que no sean ISO de exactamente 3 letras alfabéticas."""
    with pytest.raises(ValorInvalido, match="La moneda debe ser un código ISO de 3 letras"):
        Dinero(Decimal("100.00"), moneda="US")  # Muy corto

    with pytest.raises(ValorInvalido, match="La moneda debe ser un código ISO de 3 letras"):
        Dinero(Decimal("100.00"), moneda="USDT")  # Muy largo

    with pytest.raises(ValorInvalido, match="La moneda debe ser un código ISO de 3 letras"):
        Dinero(Decimal("100.00"), moneda="123")  # No alfabético


def test_factory_metodo_de():
    """Valida el funcionamiento del método de fábrica classmethod de()."""
    # Usando entero con moneda por defecto (MXN)
    dinero_int = Dinero.de(1000)
    assert dinero_int.monto == Decimal("1000.00")
    assert dinero_int.moneda == "MXN"

    # Usando string y moneda personalizada
    dinero_str = Dinero.de("450.75", moneda="eur")
    assert dinero_str.monto == Decimal("450.75")
    assert dinero_str.moneda == "EUR"

    # Usando Decimal directamente
    dinero_dec = Dinero.de(Decimal("99.99"))
    assert dinero_dec.monto == Decimal("99.99")
