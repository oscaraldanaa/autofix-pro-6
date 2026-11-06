"""Evento de dominio: hecho ocurrido, inmutable y nombrado en pasado."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID, uuid4


def utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(frozen=True, kw_only=True)
class DomainEvent:
    event_id: UUID = field(default_factory=uuid4)
    ocurrido_en: datetime = field(default_factory=utc_now)
