"""Fixtures compartidas: servicio en memoria que respeta la máquina de estados."""
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient

from src.api.dependencies import get_orden_service
from src.api.main import create_app
from src.api.ports import OrdenNoEncontradaError, ReglaNegocioError


class FakeOrdenService:
    """Doble de prueba del puerto: valida el orden del flujo (BPMN/US)."""

    def __init__(self):
        self.ordenes: dict[UUID, dict] = {}
        self.ultimo_dato: dict = {}

    def _get(self, orden_id):
        if orden_id not in self.ordenes:
            raise OrdenNoEncontradaError(f"Orden {orden_id} no existe")
        return self.ordenes[orden_id]

    def _transicion(self, orden_id, desde, hacia, regla=None):
        o = self._get(orden_id)
        if o["estado"] not in desde:
            raise ReglaNegocioError(f"No se puede pasar de {o['estado']} a {hacia}", regla)
        o["estado"] = hacia
        return o

    def registrar_ingreso(self, datos):
        oid = uuid4()
        self.ordenes[oid] = {"id": oid, "estado": "Recibido", "placas": datos["placas"],
                             "fecha_estimada_entrega": datos.get("fecha_estimada_entrega"),
                             "total_autorizado": None}
        return self.ordenes[oid]

    def registrar_diagnostico(self, orden_id, datos):
        return self._transicion(orden_id, {"Recibido"}, "Diagnosticado", "RN-01")

    def generar_cotizacion(self, orden_id, datos):
        o = self._transicion(orden_id, {"Diagnosticado"}, "Cotizado", "RN-05")
        o["total_cotizado"] = sum(c["cantidad"] * c["precio_unitario"] for c in datos["conceptos"])
        return o

    def responder_cotizacion(self, orden_id, datos):
        self.ultimo_dato = datos
        o = self._transicion(orden_id, {"Cotizado"}, "Autorizado", "RN-05")
        o["total_autorizado"] = Decimal("100.00")
        return o

    def asignar_trabajos(self, orden_id, datos):
        return self._transicion(orden_id, {"Autorizado"}, "En reparación", "RN-13")

    def registrar_falla_adicional(self, orden_id, datos):
        o = self._get(orden_id)
        if o["estado"] != "En reparación":
            raise ReglaNegocioError("Sólo en reparación", "RN-04")
        return o

    def modificar_fecha_entrega(self, orden_id, datos):
        o = self._get(orden_id)
        o["fecha_estimada_entrega"] = datos["nueva_fecha"]
        return o

    def marcar_listo_entrega(self, orden_id):
        return self._transicion(orden_id, {"En reparación"}, "Listo para entrega")

    def registrar_cobro(self, orden_id, datos):
        return self._transicion(orden_id, {"Listo para entrega"}, "Cerrado")

    def consultar_estado(self, orden_id):
        return self._get(orden_id)

    def consultar_historial_vehiculo(self, placas):
        return [o for o in self.ordenes.values() if o["placas"] == placas]


@pytest.fixture
def service() -> FakeOrdenService:
    return FakeOrdenService()


@pytest.fixture
def client(service) -> TestClient:
    app = create_app()
    app.dependency_overrides[get_orden_service] = lambda: service
    return TestClient(app)


@pytest.fixture
def ingreso_payload() -> dict:
    return {
        "cliente_id": str(uuid4()),
        "placas": "ABC-1234",
        "modelo": "Nissan Versa 2020",
        "kilometraje": 45200,
        "nivel_combustible": "1/2",
        "danos_visibles": ["Rayón puerta derecha"],
        "motivo_ingreso": "Ruido en frenos",
        "fecha_estimada_entrega": datetime(2026, 11, 20, tzinfo=UTC).isoformat(),
    }
