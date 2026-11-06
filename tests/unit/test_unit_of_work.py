import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.infrastructure.persistence.database import Base
# Ajusta la ruta de importación según la ubicación real de tu clase SqlUnitOfWork
from src.infrastructure.persistence.unit_of_work import SqlUnitOfWork 


@pytest.fixture
def session_factory():
    """Crea una fábrica de sesiones con una base de datos SQLite en memoria."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)


def test_uow_init(session_factory):
    """Valida la correcta inicialización (__init__) del Unit of Work."""
    uow = SqlUnitOfWork(session_factory)
    
    assert uow._session_factory == session_factory
    assert uow._session is None


def test_uow_enter_and_repositories(session_factory):
    """Valida el método __enter__ y la inicialización de los repositorios."""
    uow = SqlUnitOfWork(session_factory)
    
    with uow as wrapped:
        # __enter__ debe retornar la instancia del UoW
        assert wrapped is uow
        # La sesión de SQLAlchemy debe haberse creado
        assert uow._session is not None
        
        # Se comprueba que los repositorios estén instanciados correctamente
        assert uow.ordenes is not None
        assert uow.clientes is not None
        assert uow.vehiculos is not None
        assert uow.tecnicos is not None
        assert uow.cuentas_flotilla is not None


def test_uow_exit_rollback_on_error(session_factory):
    """Valida que __exit__ ejecute el rollback y cierre la sesión si ocurre una excepción."""
    uow = SqlUnitOfWork(session_factory)
    
    with pytest.raises(ValueError, match="Error simulado"):
        with uow:
            assert uow._session is not None
            raise ValueError("Error simulado")
            
    # Al salir del bloque con excepción, __exit__ debe cerrar la sesión y limpiar la referencia
    assert uow._session is None


def test_uow_exit_commit_success(session_factory):
    """Valida que __exit__ cierre la sesión correctamente tras un flujo exitoso."""
    uow = SqlUnitOfWork(session_factory)
    
    with uow:
        assert uow._session is not None
        uow.commit()
        
    # Al finalizar el bloque context manager de forma exitosa, la sesión se cierra y se limpia
    assert uow._session is None