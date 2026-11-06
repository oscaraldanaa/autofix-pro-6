import pytest
from src.api.errors import BaseAPIException

def test_excepciones_api():
    """Valida el comportamiento de las excepciones personalizadas de la API."""
    exc = BaseAPIException(message="Error de prueba", status_code=400)
    assert exc.status_code == 400
    assert exc.message == "Error de prueba"