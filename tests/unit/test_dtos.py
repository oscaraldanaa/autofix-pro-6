import uuid
from datetime import datetime
from decimal import Decimal

from src.application.dto import (
    ActualizarReposicionCmd,
    AsignarTrabajosCmd,
    CancelarOrdenCmd,
    ConceptoNuevoDTO,
    DefinirFechaEntregaCmd,
    EnviarCotizacionComplementariaCmd,
    EvidenciaDTO,
    GenerarCotizacionCmd,
    OrdenCmd,
    RegistrarClienteCmd,
    RegistrarCobroCmd,
    RegistrarCuentaFlotillaCmd,
    RegistrarDiagnosticoCmd,
    RegistrarFallaAdicionalCmd,
    RegistrarIngresoCmd,
    RegistrarTecnicoCmd,
    RegistrarVehiculoCmd,
    ReportarRefaccionSinExistenciaCmd,
    ResponderAmpliacionCmd,
    ResponderCotizacionCmd,
    SolicitudRefaccionCmd,
    TrabajoCmd,
    a_orden_dto,
)
from src.domain.entities.orden_servicio import OrdenServicio
from src.domain.value_objects.datos_recepcion import DatosRecepcion
from src.domain.value_objects.identificadores import (
    ClienteId,
    OrdenServicioId,
    VehiculoId,
)
from src.domain.value_objects.kilometraje import Kilometraje, NivelCombustible


def test_instanciar_comandos_y_dtos_entrada():
    """Valida la correcta instanciación de todos los comandos y DTOs de entrada."""
    evidencia = EvidenciaDTO(canal="sms", ip="127.0.0.1", token_verificacion="123456")
    assert evidencia.canal == "sms"

    concepto = ConceptoNuevoDTO(tipo="mano_de_obra", descripcion="Cambio de aceite", precio_unitario=Decimal("500.00"))
    assert concepto.precio_unitario == Decimal("500.00")

    assert RegistrarClienteCmd(nombre="Juan Pérez", telefono="8111111111") is not None
    assert RegistrarVehiculoCmd(placas="ABC-123", marca="Nissan", modelo="Versa", kilometraje=10000) is not None
    assert RegistrarTecnicoCmd(nombre="Carlos", especialidad="Motor") is not None
    assert RegistrarCuentaFlotillaCmd(razon_social="Flotilla S.A.", autorizador_corporativo_id="auth-1") is not None
    
    ingreso = RegistrarIngresoCmd(
        cliente_id="cli-1", 
        vehiculo_id="veh-1", 
        kilometraje=15000, 
        combustible="1/2", 
        motivo_ingreso="Revisión general",
        danos_visibles=("Rayón",)
    )
    assert ingreso.kilometraje == 15000

    assert RegistrarDiagnosticoCmd(orden_id="ord-1", tecnico_id="tec-1", hallazgos=("Falla en bujías",)) is not None
    assert GenerarCotizacionCmd(orden_id="ord-1", conceptos=(concepto,)) is not None
    assert ResponderCotizacionCmd(orden_id="ord-1", decisiones={"c-1": True}, evidencia=evidencia) is not None
    assert AsignarTrabajosCmd(orden_id="ord-1", tecnico_id="tec-1") is not None
    assert ReportarRefaccionSinExistenciaCmd(orden_id="ord-1", concepto_id="c-1") is not None
    assert ActualizarReposicionCmd(orden_id="ord-1", solicitud_id="s-1", nueva_fecha=datetime.now(), motivo="Retraso") is not None
    assert SolicitudRefaccionCmd(orden_id="ord-1", solicitud_id="s-1") is not None
    assert RegistrarFallaAdicionalCmd(orden_id="ord-1", tecnico_id="tec-1", descripcion="Frenos gastados") is not None
    assert EnviarCotizacionComplementariaCmd(orden_id="ord-1", solicitud_id="s-1", conceptos=(concepto,)) is not None
    assert ResponderAmpliacionCmd(orden_id="ord-1", solicitud_id="s-1", decisiones={"c-2": False}, evidencia=evidencia) is not None
    assert DefinirFechaEntregaCmd(orden_id="ord-1", fecha_estimada=datetime.now(), justificacion="Ajuste") is not None
    assert TrabajoCmd(orden_id="ord-1", trabajo_id="t-1") is not None
    assert OrdenCmd(orden_id="ord-1") is not None
    assert RegistrarCobroCmd(orden_id="ord-1", monto=Decimal("1500.00")) is not None
    assert CancelarOrdenCmd(orden_id="ord-1", motivo="Cliente canceló") is not None

def test_a_orden_dto_conversion():
    """Valida la función a_orden_dto transformando una entidad real de OrdenServicio."""
    id_orden = OrdenServicioId(uuid.UUID("f47ac10b-58cc-4372-a567-0e02b2c3d479"))
    id_cliente = ClienteId(uuid.UUID("3bcf8515-9983-4a1d-9786-2244f777e411"))
    id_vehiculo = VehiculoId(uuid.UUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"))

    datos_rec = DatosRecepcion(
        kilometraje=Kilometraje(20000),
        combustible=NivelCombustible("1/2"),
        danos_visibles=(),
        motivo_ingreso="Mantenimiento preventivo"
    )

    orden = OrdenServicio(
        id=id_orden,
        cliente_id=id_cliente,
        vehiculo_id=id_vehiculo,
        autorizador_id=id_cliente,
        datos_recepcion=datos_rec,
        creada_en=datetime.now(),
    )

    dto_resultado = a_orden_dto(orden)
    assert dto_resultado is not None
    assert dto_resultado.id == str(id_orden)
    assert dto_resultado.kilometraje == 20000
    assert dto_resultado.motivo_ingreso == "Mantenimiento preventivo"