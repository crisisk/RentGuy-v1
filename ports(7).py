from abc import ABC, abstractmethod
from typing import List
from .schemas import AvailabilityRequest, AvailabilityResponse

class InventoryPort(ABC):
    @abstractmethod
    def check_availability(self, requests: List[AvailabilityRequest]) -> List[AvailabilityResponse]:
        ...
