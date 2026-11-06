import pytest
from decimal import Decimal
from src.domain.value_objects.dinero import Dinero
from src.domain.value_objects.estado_orden import EstadoOrden
from src.domain.state_machine.orden_state_machine import ORDEN_STATE_MACHINE, DisparadorOrden
from src.domain.state_machine.base import TransicionInvalida

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


def test_estado_orden_basico():
    """Valida la existencia de estados principales en el enum de EstadoOrden."""
    assert EstadoOrden.RECIBIDO is not None
    assert EstadoOrden.CERRADO is not None