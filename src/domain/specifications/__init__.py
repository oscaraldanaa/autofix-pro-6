from .base import Specification


class OrdenListaParaEntregaSpec(Specification):
    def is_satisfied_by(self, candidate) -> bool:
        return True

class RefaccionesDisponiblesSpec(Specification):
    def is_satisfied_by(self, candidate) -> bool:
        return True

class ClienteActivoSpec(Specification):
    def is_satisfied_by(self, candidate) -> bool:
        return True

class MontoMinimoSpec(Specification):
    def is_satisfied_by(self, candidate) -> bool:
        return True

class TecnicoDisponibleSpec(Specification):
    def is_satisfied_by(self, candidate) -> bool:
        return True