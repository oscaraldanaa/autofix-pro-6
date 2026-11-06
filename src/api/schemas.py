"""Contratos HTTP (DTOs Pydantic v2). Cada campo cita su regla de negocio."""
from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

NivelCombustible = Literal["VACIO", "1/4", "1/2", "3/4", "LLENO"]


class IngresoIn(BaseModel):
    """US-01 / RN-01: datos completos de recepción antes de diagnosticar."""

    cliente_id: UUID
    placas: str = Field(min_length=5, max_length=10, examples=["ABC-1234"])
    vin: str | None = Field(default=None, min_length=11, max_length=17)
    modelo: str = Field(min_length=2, examples=["Nissan Versa 2020"])
    kilometraje: int = Field(ge=0, examples=[45200])
    nivel_combustible: NivelCombustible
    danos_visibles: list[str] = Field(default_factory=list)
    motivo_ingreso: str = Field(min_length=3, examples=["Ruido en frenos"])
    fecha_estimada_entrega: datetime | None = None


class HallazgoIn(BaseModel):
    descripcion: str = Field(min_length=3)
    refacciones_requeridas: list[str] = Field(default_factory=list)


class DiagnosticoIn(BaseModel):
    """US-02: el técnico registra hallazgos → estado Diagnosticado."""

    tecnico_id: UUID
    hallazgos: list[HallazgoIn] = Field(min_length=1)


class ConceptoIn(BaseModel):
    descripcion: str = Field(min_length=2)
    tipo: Literal["MANO_OBRA", "REFACCION"]
    cantidad: int = Field(default=1, ge=1)
    precio_unitario: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class CotizacionIn(BaseModel):
    """US-03 / RN-05: cotización con mano de obra y refacciones."""

    conceptos: list[ConceptoIn] = Field(min_length=1)


class DecisionConceptoIn(BaseModel):
    concepto_id: UUID
    autorizado: bool


class RespuestaCotizacionIn(BaseModel):
    """US-04 / RN-05, RN-10: autorización o rechazo total o parcial."""

    decisiones: list[DecisionConceptoIn] = Field(min_length=1)
    canal: Literal["PORTAL", "SMS", "EMAIL"] = "PORTAL"
    token_verificacion: str | None = Field(default=None, min_length=6)


class AsignacionIn(BaseModel):
    """US-05 / RN-13: sólo se asigna lo autorizado."""

    tecnico_id: UUID


class FallaAdicionalIn(BaseModel):
    """US-08 / RN-04: falla detectada durante la reparación."""

    tecnico_id: UUID
    descripcion: str = Field(min_length=5)


class FechaEntregaIn(BaseModel):
    """US-11 / RN-06: todo cambio de fecha requiere justificación."""

    nueva_fecha: datetime
    motivo: str = Field(min_length=5, examples=["Espera de refacción con proveedor"])


class CobroIn(BaseModel):
    """US-15: cobro sólo de conceptos autorizados y entregados."""

    monto: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    metodo_pago: Literal["EFECTIVO", "TARJETA", "TRANSFERENCIA", "CREDITO_CORPORATIVO"]


class OrdenOut(BaseModel):
    """Vista de lectura de una orden (DTOOrdenServicioDetalle)."""

    model_config = ConfigDict(extra="allow")

    id: UUID
    estado: str
    fecha_estimada_entrega: datetime | None = None
    total_autorizado: Decimal | None = None


class ErrorOut(BaseModel):
    codigo: str
    detail: str
    regla: str | None = None
