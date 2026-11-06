from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.errors import register_error_handlers
from src.api.ports import OrdenNoEncontradaError, ReglaNegocioError
from src.api.settings import Settings


def test_settings_lee_variables_de_entorno(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://u:p@h:5432/x")
    monkeypatch.setenv("ENVIRONMENT", "test")
    st = Settings(_env_file=None)
    assert st.database_url.endswith("/x") and st.environment == "test"


def _app_con_rutas() -> TestClient:
    app = FastAPI()
    register_error_handlers(app)

    @app.get("/nf")
    def nf():
        raise OrdenNoEncontradaError("no existe")

    @app.get("/rn")
    def rn():
        raise ReglaNegocioError("orden cerrada", "RN-13")

    return TestClient(app)


def test_no_encontrada_responde_404():
    r = _app_con_rutas().get("/nf")
    assert r.status_code == 404 and r.json()["codigo"] == "NO_ENCONTRADO"


def test_regla_negocio_responde_409_con_regla():
    r = _app_con_rutas().get("/rn")
    assert r.status_code == 409 and r.json()["regla"] == "RN-13"
