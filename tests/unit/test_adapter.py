"""El adaptador traduce excepciones de dominio al puerto de la API."""
import importlib
import sys
import types
from uuid import uuid4

import pytest

try:  # usa el dominio real si existe (Fases 1-3); si no, un stub equivalente
    importlib.import_module("src.domain.exceptions")
except ImportError:  # pragma: no cover
    mod = types.ModuleType("src.domain.exceptions")
    mod.DomainError = type("DomainError", (Exception,), {})
    mod.EntityNotFoundError = type("EntityNotFoundError", (Exception,), {})
    sys.modules.setdefault("src.domain", types.ModuleType("src.domain"))
    sys.modules["src.domain.exceptions"] = mod

from src.domain.exceptions import DomainError, EntityNotFoundError

from src.api.adapter import OrdenServiceAdapter
from src.api.ports import OrdenNoEncontradaError, ReglaNegocioError


class Fachada:
    def __init__(self, error=None):
        self.error = error

    def __getattr__(self, nombre):
        def _llamar(*args, **kwargs):
            if self.error:
                raise self.error
            return {"metodo": nombre}
        return _llamar


def test_delegacion_feliz():
    a = OrdenServiceAdapter(Fachada(), Fachada())
    oid = uuid4()
    assert a.registrar_ingreso({})["metodo"] == "registrar_ingreso_vehiculo"
    assert a.consultar_estado(oid)["metodo"] == "consultar_estado_orden"
    for m in ("registrar_diagnostico", "generar_cotizacion", "responder_cotizacion", "asignar_trabajos",
              "registrar_falla_adicional", "modificar_fecha_entrega", "registrar_cobro"):
        assert getattr(a, m)(oid, {})["metodo"] == m
    assert a.marcar_listo_entrega(oid)["metodo"] == "marcar_listo_entrega"
    assert a.consultar_historial_vehiculo("ABC")["metodo"] == "consultar_historial_vehiculo"


def test_traduce_no_encontrado():
    a = OrdenServiceAdapter(Fachada(), Fachada(EntityNotFoundError("x")))
    with pytest.raises(OrdenNoEncontradaError):
        a.consultar_estado(uuid4())


def test_traduce_regla_de_dominio():
    a = OrdenServiceAdapter(Fachada(DomainError("orden cerrada")), Fachada())
    with pytest.raises(ReglaNegocioError):
        a.registrar_cobro(uuid4(), {})
