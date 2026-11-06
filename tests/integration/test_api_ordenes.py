"""Integración HTTP → router → puerto. Recorre el flujo completo del BPMN."""
from uuid import uuid4

CONCEPTOS = {"conceptos": [
    {"descripcion": "Cambio de balatas", "tipo": "MANO_OBRA", "precio_unitario": "350.00"},
    {"descripcion": "Balatas delanteras", "tipo": "REFACCION", "cantidad": 2, "precio_unitario": "420.50"},
]}


def _crear(client, payload) -> str:
    r = client.post("/api/v1/ordenes", json=payload)
    assert r.status_code == 201
    return r.json()["id"]


def test_flujo_feliz_completo(client, ingreso_payload):
    oid = _crear(client, ingreso_payload)
    base = f"/api/v1/ordenes/{oid}"
    assert client.post(f"{base}/diagnostico", json={
        "tecnico_id": str(uuid4()), "hallazgos": [{"descripcion": "Balatas gastadas"}]}).json()["estado"] == "Diagnosticado"
    assert client.post(f"{base}/cotizacion", json=CONCEPTOS).json()["estado"] == "Cotizado"
    r = client.post(f"{base}/cotizacion/respuesta", json={
        "decisiones": [{"concepto_id": str(uuid4()), "autorizado": True}], "token_verificacion": "abc123"})
    assert r.json()["estado"] == "Autorizado"
    assert client.post(f"{base}/asignacion", json={"tecnico_id": str(uuid4())}).json()["estado"] == "En reparación"
    assert client.post(f"{base}/listo-entrega").json()["estado"] == "Listo para entrega"
    r = client.post(f"{base}/cobro", json={"monto": "1191.00", "metodo_pago": "TARJETA"})
    assert r.json()["estado"] == "Cerrado"
    assert client.get(base).json()["estado"] == "Cerrado"


def test_ip_del_cliente_se_registra_en_autorizacion(client, service, ingreso_payload):
    oid = _crear(client, ingreso_payload)
    base = f"/api/v1/ordenes/{oid}"
    client.post(f"{base}/diagnostico", json={"tecnico_id": str(uuid4()), "hallazgos": [{"descripcion": "Falla X"}]})
    client.post(f"{base}/cotizacion", json=CONCEPTOS)
    client.post(f"{base}/cotizacion/respuesta",
                json={"decisiones": [{"concepto_id": str(uuid4()), "autorizado": False}]})
    assert service.ultimo_dato["ip_origen"]  # RN-11


def test_orden_inexistente_404(client):
    r = client.get(f"/api/v1/ordenes/{uuid4()}")
    assert r.status_code == 404 and r.json()["codigo"] == "NO_ENCONTRADO"


def test_transicion_invalida_409_con_regla(client, ingreso_payload):
    oid = _crear(client, ingreso_payload)
    r = client.post(f"/api/v1/ordenes/{oid}/cobro", json={"monto": "10", "metodo_pago": "EFECTIVO"})
    assert r.status_code == 409 and r.json()["codigo"] == "REGLA_NEGOCIO"


def test_trabajo_sin_autorizacion_409_rn13(client, ingreso_payload):
    oid = _crear(client, ingreso_payload)
    r = client.post(f"/api/v1/ordenes/{oid}/asignacion", json={"tecnico_id": str(uuid4())})
    assert r.status_code == 409 and r.json()["regla"] == "RN-13"


def test_payload_invalido_422(client, ingreso_payload):
    ingreso_payload["kilometraje"] = -5
    assert client.post("/api/v1/ordenes", json=ingreso_payload).status_code == 422


def test_falla_adicional_y_cambio_de_fecha(client, ingreso_payload):
    oid = _crear(client, ingreso_payload)
    base = f"/api/v1/ordenes/{oid}"
    r = client.post(f"{base}/fallas-adicionales", json={"tecnico_id": str(uuid4()), "descripcion": "Disco deformado"})
    assert r.status_code == 409  # aún no está en reparación (RN-04)
    r = client.put(f"{base}/fecha-entrega", json={"nueva_fecha": "2026-12-01T10:00:00Z", "motivo": "Espera de refacción"})
    assert r.status_code == 200
    assert client.put(f"{base}/fecha-entrega", json={"nueva_fecha": "2026-12-01T10:00:00Z", "motivo": ""}).status_code == 422


def test_historial_vehiculo(client, ingreso_payload):
    _crear(client, ingreso_payload)
    assert len(client.get("/api/v1/vehiculos/ABC-1234/historial").json()) == 1
    assert client.get("/api/v1/vehiculos/ZZZ-0000/historial").json() == []


def test_health_y_openapi(client):
    assert client.get("/health").json()["status"] == "ok"
    spec = client.get("/openapi.json").json()
    assert "/api/v1/ordenes" in spec["paths"]
    assert "/api/v1/ordenes/{orden_id}/cobro" in spec["paths"]
    assert client.get("/docs").status_code == 200
