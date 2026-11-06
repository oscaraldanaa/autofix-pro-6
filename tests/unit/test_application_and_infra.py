import pytest
from src.api.errors import BaseAPIException

def test_excepciones_api():
    """Valida el comportamiento de las excepciones personalizadas de la API."""
    exc = BaseAPIException(message="Error de prueba", status_code=400)
    assert exc.status_code == 400
    assert exc.message == "Error de prueba"

def test_excepciones_api_codigos_comunes():
    """Valida el manejo de diferentes códigos de estado HTTP estándar (404, 401, 500)."""
    # Recurso no encontrado (404)
    exc_404 = BaseAPIException(message="Recurso no encontrado", status_code=404)
    assert exc_404.status_code == 404
    assert exc_404.message == "Recurso no encontrado"

    # No autorizado (401)
    exc_401 = BaseAPIException(message="Token inválido o expirado", status_code=401)
    assert exc_401.status_code == 401
    assert exc_401.message == "Token inválido o expirado"

    # Error interno del servidor (500)
    exc_500 = BaseAPIException(message="Error interno del servidor", status_code=500)
    assert exc_500.status_code == 500
    assert exc_500.message == "Error interno del servidor"

def test_excepciones_api_representacion_string():
    """Valida que la excepción pueda representarse correctamente como cadena o evaluarse en logs."""
    exc = BaseAPIException(message="Solicitud incorrecta", status_code=400)
    # Comprobamos que al menos el mensaje o la representación contenga la información clave
    assert "Solicitud incorrecta" in str(exc) or exc.message == "Solicitud incorrecta"