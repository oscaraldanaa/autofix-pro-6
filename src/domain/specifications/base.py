from abc import ABC, abstractmethod
from typing import Generic, TypeVar

T = TypeVar("T")

class Specification(ABC, Generic[T]):
    @abstractmethod
    def is_satisfied_by(self, candidate: T) -> bool:
        pass

    def __and__(self, other: "Specification[T]") -> "Specification[T]":
        return AndSpecification(self, other)

    def __or__(self, other: "Specification[T]") -> "Specification[T]":
        return OrSpecification(self, other)

    def __invert__(self) -> "Specification[T]":
        return NotSpecification(self)


class AndSpecification(Specification[T]):
    def __init__(self, spec1: Specification[T], spec2: Specification[T]):
        self.spec1 = spec1
        self.spec2 = spec2

    def is_satisfied_by(self, candidate: T) -> bool:
        return self.spec1.is_satisfied_by(candidate) and self.spec2.is_satisfied_by(candidate)


class OrSpecification(Specification[T]):
    def __init__(self, spec1: Specification[T], spec2: Specification[T]):
        self.spec1 = spec1
        self.spec2 = spec2

    def is_satisfied_by(self, candidate: T) -> bool:
        return self.spec1.is_satisfied_by(candidate) or self.spec2.is_satisfied_by(candidate)


class NotSpecification(Specification[T]):
    def __init__(self, spec: Specification[T]):
        self.spec = spec

    def is_satisfied_by(self, candidate: T) -> bool:
        return not self.spec.is_satisfied_by(candidate)