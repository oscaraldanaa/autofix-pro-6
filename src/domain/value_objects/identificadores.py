"""Identificadores tipados (UUID) para cada entidad del dominio."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Self, TypeVar
from uuid import UUID, uuid4

from ..shared import ValorInvalido, ValueObject

T = TypeVar("T", bound="EntityId")


@dataclass(frozen=True)
class EntityId(ValueObject):
    value: UUID

    def _validar(self) -> None:
        if not isinstance(self.value, UUID):
            raise ValorInvalido(f"{type(self).__name__} requiere un UUID, recibió {type(self.value).__name__}")

    @classmethod
    def generar(cls) -> Self:
        return cls(uuid4())

    @classmethod
    def desde_str(cls, texto: str) -> Self:
        try:
            return cls(UUID(texto))
        except ValueError as exc:
            raise ValorInvalido(f"UUID inválido: {texto!r}") from exc

    def __str__(self) -> str:
        return str(self.value)


class OrdenServicioId(EntityId): ...
class ClienteId(EntityId): ...
class VehiculoId(EntityId): ...
class TecnicoId(EntityId): ...
class CuentaFlotillaId(EntityId): ...
class CotizacionId(EntityId): ...
class ConceptoId(EntityId): ...
class TrabajoId(EntityId): ...
class SolicitudRefaccionId(EntityId): ...
class SolicitudAmpliacionId(EntityId): ...
