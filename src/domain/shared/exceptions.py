"""Excepciones del dominio. No dependen de ningún framework."""


class DomainError(Exception):
    """Error base de la capa de dominio."""


class ValorInvalido(DomainError):
    """Un Value Object o atributo viola su invariante de construcción."""


class ReglaDeNegocioViolada(DomainError):
    """Se intentó una operación que viola una regla del BRD (RN-xx)."""

    def __init__(self, regla: str, mensaje: str) -> None:
        super().__init__(f"[{regla}] {mensaje}")
        self.regla = regla
        self.mensaje = mensaje

class EntidadNoEncontrada(ReglaDeNegocioViolada):
    """Lanzada cuando un repositorio o servicio no encuentra una entidad por su identificador."""
    def __init__(self, entidad: str, id_valor: object, regla: str = "RN-404") -> None:
        self.entidad = entidad
        self.id_valor = id_valor
        mensaje = f"No se encontró la entidad '{entidad}' con ID '{id_valor}'."
        super().__init__(regla=regla, mensaje=mensaje)