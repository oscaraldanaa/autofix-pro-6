"""Listados de lectura que alimentan la interfaz web, y servido de la propia interfaz."""
B = "/api/v1"
ASESOR = {"X-Rol": "asesor_servicio"}


def _crear(api, url, body):
    r = api.post(f"{B}{url}", json=body, headers=ASESOR)
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_los_listados_estan_vacios_al_inicio(api):
    for url in ("/clientes", "/vehiculos", "/tecnicos", "/flotillas", "/ordenes", "/catalogo"):
        r = api.get(f"{B}{url}")
        assert r.status_code == 200 and r.json() == [], url


def test_los_listados_devuelven_lo_registrado_y_son_de_consulta_abierta(api):
    cli = _crear(api, "/clientes", {"nombre": "Ana López", "telefono": "8112345678", "es_preferente": True})
    corp = _crear(api, "/clientes", {"nombre": "Beto Gerente", "email": "beto@flota.mx"})
    fl = _crear(api, "/flotillas", {"razon_social": "Transportes SA", "autorizador_corporativo_id": corp,
                                    "descuento_pct": "5", "prioridad": 2, "dias_credito": 30})
    veh = _crear(api, "/vehiculos", {"placas": "abc-123", "marca": "Nissan", "modelo": "Versa", "kilometraje": 50000})
    _crear(api, "/tecnicos", {"nombre": "Luis Pérez", "especialidad": "Frenos"})

    clientes = api.get(f"{B}/clientes").json()           # ordenados por nombre; sin cabecera X-Rol (RN-02)
    assert [c["nombre"] for c in clientes] == ["Ana López", "Beto Gerente"]
    assert clientes[0]["es_preferente"] is True and clientes[0]["activo"] is True
    assert clientes[1]["email"] == "beto@flota.mx"

    assert api.get(f"{B}/vehiculos").json()[0] | {"id": ""} == {
        "id": "", "placas": "ABC-123", "marca": "Nissan", "modelo": "Versa", "kilometraje": 50000,
        "vin": None, "cuenta_flotilla_id": None}
    assert api.get(f"{B}/tecnicos").json()[0]["disponible"] is True
    f = api.get(f"{B}/flotillas").json()[0]
    assert (f["id"], f["razon_social"], f["autorizador_corporativo_id"], f["prioridad"], f["dias_credito"]) == (
        fl, "Transportes SA", corp, 2, 30)
    assert float(f["descuento_pct"]) == 5

    o1 = _crear_orden(api, cli, veh, "Ruido al frenar")
    ordenes = api.get(f"{B}/ordenes").json()
    assert len(ordenes) == 1
    assert ordenes[0] | {"creada_en": ""} == {
        "id": o1, "estado": "Recibido", "cliente_id": cli, "vehiculo_id": veh, "creada_en": "",
        "motivo_ingreso": "Ruido al frenar", "es_flotilla": False, "fecha_entrega": None, "total_autorizado": "0.00"}


def _crear_orden(api, cli, veh, motivo):
    r = api.post(f"{B}/ordenes", headers=ASESOR, json={
        "cliente_id": cli, "vehiculo_id": veh, "kilometraje": 50100, "combustible": "1/2", "motivo_ingreso": motivo})
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_las_ordenes_se_listan_de_la_mas_reciente_a_la_mas_antigua(api):
    cli = _crear(api, "/clientes", {"nombre": "Ana", "telefono": "8112345678"})
    veh = _crear(api, "/vehiculos", {"placas": "ABC-123", "marca": "N", "modelo": "V", "kilometraje": 0})
    primera = _crear_orden(api, cli, veh, "primera")
    segunda = _crear_orden(api, cli, veh, "segunda")
    assert [o["id"] for o in api.get(f"{B}/ordenes").json()] == [segunda, primera]


def test_la_interfaz_web_se_sirve_en_la_raiz_con_sus_recursos(api):
    raiz = api.get("/")
    assert raiz.status_code == 200 and "text/html" in raiz.headers["content-type"]
    assert "AutoFix Pro" in raiz.text and "/web/app.js" in raiz.text
    css = api.get("/web/styles.css")
    assert css.status_code == 200 and "--rojo" in css.text
    assert api.get("/web/app.js").status_code == 200
