from .base import Specification

# Clases de especificación requeridas por la máquina de estados
class OrdenListaParaEntregaSpec(Specification):
    def is_satisfied_by(self, candidate) -> bool:
        # Lógica de validación de la especificación
        return True

class RefaccionesDisponiblesSpec(Specification):
    def is_satisfied_by(self, candidate) -> bool:
        # Lógica de validación de refacciones
        return True