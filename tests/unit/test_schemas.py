"""Pruebas unitarias de validación de contratos (RN-01, RN-05, RN-06)."""
from uuid import uuid4

import pytest
from pydantic import ValidationError

from src.api import schemas as s


def test_ingreso_valido(ingreso_payload):
    assert s.IngresoIn(**ingreso_payload).kilometraje == 45200


@pytest.mark.parametrize("campo,valor", [
    ("kilometraje", -1), ("placas", "AB"), ("motivo_ingreso", ""), ("nivel_combustible", "MEDIO"),
])
def test_ingreso_rechaza_datos_incompletos_o_invalidos(ingreso_payload, campo, valor):
    ingreso_payload[campo] = valor
    with pytest.raises(ValidationError):
        s.IngresoIn(**ingreso_payload)


def test_cotizacion_requiere_al_menos_un_concepto():
    with pytest.raises(ValidationError):
        s.CotizacionIn(conceptos=[])


def test_concepto_precio_debe_ser_positivo():
    with pytest.raises(ValidationError):
        s.ConceptoIn(descripcion="Balatas", tipo="REFACCION", precio_unitario=0)


def test_cambio_de_fecha_exige_motivo():
    with pytest.raises(ValidationError):
        s.FechaEntregaIn(nueva_fecha="2026-11-30T10:00:00Z", motivo="")


def test_respuesta_cotizacion_parcial_valida():
    r = s.RespuestaCotizacionIn(decisiones=[
        {"concepto_id": str(uuid4()), "autorizado": True},
        {"concepto_id": str(uuid4()), "autorizado": False},
    ])
    assert [d.autorizado for d in r.decisiones] == [True, False]
