import uuid
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.domain.entities import (
    CondicionesFlotilla,
    CuentaFlotilla,
    Tecnico,
    Vehiculo,
)
from src.domain.value_objects import (
    ClienteId,
    CuentaFlotillaId,
    Kilometraje,
    Placas,
    Porcentaje,
    TecnicoId,
    VehiculoId,
)
from src.infrastructure.persistence.database import Base
from src.infrastructure.persistence.mappers import _rehidratar
from src.infrastructure.persistence.repositorios import (
    SqlClienteRepository,
    SqlCuentaFlotillaRepository,
    SqlTecnicoRepository,
    SqlVehiculoRepository,
)


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.rollback()
    session.close()


def test_vehiculo_buscar_por_placas_y_obtener_error(db_session):
    """
    Cubre:
    - Líneas 77-78: SqlVehiculoRepository.buscar_por_placas
    - Líneas 81-84: SqlVehiculoRepository.obtener (lanzando EntidadNoEncontrada)
    """
    repo = SqlVehiculoRepository(db_session)
    vid = VehiculoId(uuid.uuid4())
    placas = Placas("XYZ-99-88")
    
    vehiculo = _rehidratar(
        Vehiculo, vid,
        placas=placas,
        marca="Toyota",
        modelo="Corolla",
        kilometraje=Kilometraje(15000),
        vin=None,
        cuenta_flotilla_id=None
    )
    
    # Guarda el vehículo para que exista en base de datos
    repo.guardar(vehiculo)
    db_session.commit()

    # 1. Prueba de buscar_por_placas (Líneas 77-78)
    encontrado = repo.buscar_por_placas(placas)
    assert encontrado is not None
    assert encontrado.id == vid

    # 2. Prueba de obtener con ID inexistente (Líneas 81-84)
    with pytest.raises(Exception):
        repo.obtener(VehiculoId(uuid.uuid4()))


def test_tecnico_obtener_error(db_session):
    """
    Cubre:
    - Línea 99: SqlTecnicoRepository.obtener (lanzando EntidadNoEncontrada si el técnico no existe)
    """
    repo = SqlTecnicoRepository(db_session)
    
    # Intenta obtener un técnico que no ha sido registrado
    with pytest.raises(Exception):
        repo.obtener(TecnicoId(uuid.uuid4()))

def test_tecnico_repo_listar_disponibles_y_excepcion(db_session):
    """Prueba listar técnicos disponibles y excepciones."""
    repo = SqlTecnicoRepository(db_session)
    
    with pytest.raises(Exception):
        repo.obtener(TecnicoId(uuid.uuid4()))

    tid_disp = TecnicoId(uuid.uuid4())
    tid_no_disp = TecnicoId(uuid.uuid4())
    
    repo.guardar(_rehidratar(Tecnico, tid_disp, nombre="Carlos", especialidad="Motor", disponible=True))
    repo.guardar(_rehidratar(Tecnico, tid_no_disp, nombre="Mario", especialidad="Transmisión", disponible=False))
    db_session.commit()

    disponibles = repo.listar_disponibles()
    assert len(disponibles) == 1
    assert disponibles[0].id == tid_disp


def test_cliente_y_cuenta_flotilla_excepciones(db_session):
    """Prueba excepciones en repositorios de cliente y cuenta de flotilla."""
    with pytest.raises(Exception):
        SqlClienteRepository(db_session).obtener(ClienteId(uuid.uuid4()))

    with pytest.raises(Exception):
        SqlCuentaFlotillaRepository(db_session).obtener(CuentaFlotillaId(uuid.uuid4()))

def test_cuenta_flotilla_guardar_y_obtener(db_session):
    """
    Cubre:
    - Línea 108: SqlCuentaFlotillaRepository.guardar
    """
    repo = SqlCuentaFlotillaRepository(db_session)
    fid = CuentaFlotillaId(uuid.uuid4())
    auth_id = ClienteId(uuid.uuid4())

    cuenta = _rehidratar(
        CuentaFlotilla, fid,
        razon_social="Empresa de Transportes SA",
        autorizador_corporativo_id=auth_id,
        condiciones=CondicionesFlotilla(Porcentaje(Decimal("10.0")), 1, 30)
    )

    # 1. Prueba de guardar cuenta de flotilla (Línea 108 aprox.)
    repo.guardar(cuenta)
    db_session.commit()

    # 2. Verifica recuperación exitosa
    recuperada = repo.buscar_por_id(fid)
    assert recuperada is not None
    assert recuperada.id == fid

    # 3. Prueba de obtener con ID inexistente para cubrir la excepción del método obtener
    with pytest.raises(Exception):
        repo.obtener(CuentaFlotillaId(uuid.uuid4()))