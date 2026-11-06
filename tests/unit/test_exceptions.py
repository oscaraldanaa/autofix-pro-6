import pytest
from src.domain.shared.exceptions import (
    DomainError,
    ValorInvalido,
    ReglaDeNegocioViolada,
    EntidadNoEncontrada,
)


def test_domain_error_y_valor_invalido():
    """Valida la existencia y el lanzamiento de las excepciones base DomainError y ValorInvalido[cite: 7]."""
    with pytest.raises(DomainError):
        raise DomainError("Error general del dominio")

    with pytest.raises(ValorInvalido):
        raise ValorInvalido("El valor ingresado es inválido")


def test_regla_de_negocio_violada_init():
    """Valida el método __init__ y el formateo del mensaje en ReglaDeNegocioViolada[cite: 7]."""
    excepcion = ReglaDeNegocioViolada("RN-01", "Saldo insuficiente")
    
    assert excepcion.regla == "RN-01"
    assert excepcion.mensaje == "Saldo insuficiente"
    assert str(excepcion) == "[RN-01] Saldo insuficiente"


def test_entidad_no_encontrada_init():
    """Valida el método __init__ de EntidadNoEncontrada, incluyendo su regla por defecto y personalizada[cite: 7]."""
    # Prueba con los valores por defecto (regla "RN-404")
    exc_default = EntidadNoEncontrada("Vehiculo", "XYZ-123")
    assert exc_default.entidad == "Vehiculo"
    assert exc_default.id_valor == "XYZ-123"
    assert exc_default.regla == "RN-404"
    assert "No se encontró la entidad 'Vehiculo' con ID 'XYZ-123'." in str(exc_default)

    # Prueba sobreescribiendo la regla de negocio
    exc_custom = EntidadNoEncontrada("Tecnico", 45, regla="RN-99")
    assert exc_custom.regla == "RN-99"
    assert "[RN-99]" in str(exc_custom)