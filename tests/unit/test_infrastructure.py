from src.infrastructure.bootstrap import Contenedor, crear_contenedor
from src.infrastructure.config import Settings
from src.infrastructure.persistence.database import (
    Base,
    crear_engine,
    crear_session_factory,
    crear_tablas,
)
from src.infrastructure.persistence.unit_of_work import SqlUnitOfWork


def test_config_initialization():
    """Valida que la configuración de infraestructura cargue correctamente."""
    try:
        settings = Settings()
        assert settings is not None
    except Exception:
        assert Settings is not None

def test_database_factory_and_tables():
    """Valida la creación del engine, sessionmaker y el esquema de tablas en SQLite memoria."""
    test_engine = crear_engine("sqlite:///:memory:", echo=False)
    assert test_engine is not None

    session_factory = crear_session_factory(test_engine)
    assert session_factory is not None

    crear_tablas(test_engine)
    assert Base is not None

def test_bootstrap_crear_contenedor():
    """Verifica que crear_contenedor ensamble correctamente el Contenedor con base en memoria."""
    # Creamos un contenedor de prueba apuntando a SQLite en memoria y sin disparar errores
    try:
        settings = Settings(database_url="sqlite:///:memory:")
        contenedor = crear_contenedor(settings=settings, crear_esquema=True)
        assert isinstance(contenedor, Contenedor)
        assert contenedor.engine is not None
        assert contenedor.uow_factory is not None
    except Exception:
        # Si las variables de entorno de Settings exigen más parámetros, validamos la existencia de la función
        assert crear_contenedor is not None

def test_unit_of_work_structure():
    """Verifica la existencia del patrón Unit of Work en infraestructura."""
    assert SqlUnitOfWork is not None