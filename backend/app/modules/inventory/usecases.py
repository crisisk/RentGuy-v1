from typing import List
from sqlalchemy.orm import Session
from .ports import InventoryPort
from .schemas import AvailabilityRequest, AvailabilityResponse
from .repo import InventoryRepo

class InventoryService(InventoryPort):
    def __init__(self, db: Session):
        self.repo = InventoryRepo(db)

    def check_availability(self, requests: List[AvailabilityRequest]) -> List[AvailabilityResponse]:
        res: list[AvailabilityResponse] = []
        for r in requests:
            available = self.repo.calc_available(r.item_id, r.start, r.end)
            res.append(AvailabilityResponse(item_id=r.item_id, requested=r.quantity, available=available, ok=available >= r.quantity))
        return res
