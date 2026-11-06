from __future__ import annotations

from ..shared import Entity, ValorInvalido
from ..value_objects import ClienteId, CuentaFlotillaId, DatosContacto


class Cliente(Entity[ClienteId]):
    """Propietario del vehículo o administrador de flotilla (glosario: Cliente)."""

    def __init__(
        self,
        id: ClienteId,
        nombre: str,
        contacto: DatosContacto,
        cuenta_flotilla_id: CuentaFlotillaId | None = None,
    ) -> None:
        super().__init__(id)
        if not nombre or not nombre.strip():
            raise ValorInvalido("El nombre del cliente es obligatorio")
        self._nombre = nombre.strip()
        self._contacto = contacto
        self._cuenta_flotilla_id = cuenta_flotilla_id

    @property
    def nombre(self) -> str:
        return self._nombre

    @property
    def contacto(self) -> DatosContacto:
        return self._contacto

    @property
    def cuenta_flotilla_id(self) -> CuentaFlotillaId | None:
        return self._cuenta_flotilla_id

    @property
    def es_corporativo(self) -> bool:
        return self._cuenta_flotilla_id is not None

    def verificar_estatus_flotilla(self) -> bool:
        return self.es_corporativo

    def actualizar_contacto(self, contacto: DatosContacto) -> None:
        self._contacto = contacto
