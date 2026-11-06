import uuid
from decimal import Decimal

import pytest

from src.domain.entities.cotizacion import (
    ConceptoCotizacion,
    Cotizacion,
    EstadoConcepto,
    TipoConcepto,
    TipoCotizacion,
)
from src.domain.shared import ValorInvalido, utc_now
from src.domain.value_objects import (
    ConceptoId,
    CotizacionId,
    Dinero,
)


def test_concepto_cotizacion_init_y_propiedades():
    """Prueba la inicialización, validaciones y propiedades básicas de ConceptoCotizacion."""
    cid = ConceptoId(uuid.uuid4())
    precio = Dinero(Decimal("100.00"))
    
    # Creación exitosa
    concepto = ConceptoCotizacion(cid, TipoConcepto.MANO_DE_OBRA, "Frenos", precio, 2)
    assert concepto.id == cid
    assert concepto.tipo == TipoConcepto.MANO_DE_OBRA
    assert concepto.descripcion == "Frenos"
    assert concepto.precio_unitario == precio
    assert concepto.cantidad == Decimal(2)
    assert concepto.estado == EstadoConcepto.PENDIENTE
    assert not concepto.autorizado

    # Excepción por descripción vacía
    with pytest.raises(ValorInvalido, match="La descripción del concepto es obligatoria"):
        ConceptoCotizacion(cid, TipoConcepto.REFACCION, "   ", precio, 1)

    # Excepción por cantidad menor o igual a cero
    with pytest.raises(ValorInvalido, match="La cantidad debe ser mayor a cero"):
        ConceptoCotizacion(cid, TipoConcepto.REFACCION, "Filtro", precio, 0)


def test_cotizacion_init_y_colecciones():
    """Prueba la inicialización de Cotización, validación de duplicados y filtros de conceptos."""
    c_id = ConceptoId(uuid.uuid4())
    concepto = ConceptoCotizacion(c_id, TipoConcepto.MANO_DE_OBRA, "Afinación", Dinero(Decimal("500.00")), 1)
    cot_id = CotizacionId(uuid.uuid4())
    
    # Excepción por lista de conceptos vacía
    with pytest.raises(ValorInvalido, match="Una cotización requiere al menos un concepto"):
        Cotizacion(cot_id, TipoCotizacion.INICIAL, [], utc_now())

    # Excepción por conceptos duplicados
    with pytest.raises(ValorInvalido, match="Conceptos duplicados en la cotización"):
        Cotizacion(cot_id, TipoCotizacion.INICIAL, [concepto, concepto], utc_now())

    cotizacion = Cotizacion(cot_id, TipoCotizacion.INICIAL, [concepto], utc_now())
    assert cotizacion.id == cot_id
    assert cotizacion.tipo == TipoCotizacion.INICIAL
    assert len(cotizacion.conceptos) == 1
    assert cotizacion.respondida is False
