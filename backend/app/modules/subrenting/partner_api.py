"""
Partner API integration for availability sync and reservations
Implements retry logic and error handling
"""
import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from .models import PartnerAvailability
from .schemas import AvailabilityResponse

logger = logging.getLogger(__name__)

class PartnerAPIClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(aiohttp.ClientError)
    )
    async def sync_availability(self, availabilities: List[PartnerAvailability]):
        """Sync availability slots with partner API"""
        try:
            payload = [self._format_availability(av) for av in availabilities]
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/availability/sync",
                    json=payload,
                    headers=self.headers
                ) as response:
                    response.raise_for_status()
                    return await response.json()
        except aiohttp.ClientError as e:
            logger.error(f"Availability sync failed: {str(e)}")
            raise
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(aiohttp.ClientError)
    )
    async def push_reservation(self, availability_id: UUID, reservation_details: dict):
        """Push reservation to partner system"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/reservations",
                    json=reservation_details,
                    headers=self.headers
                ) as response:
                    response.raise_for_status()
                    return await response.json()
        except aiohttp.ClientError as e:
            logger.error(f"Reservation push failed: {str(e)}")
            raise
    
    def _format_availability(self, availability: PartnerAvailability) -> dict:
        """Convert DB model to partner API format"""
        return {
            "slot_id": str(availability.id),
            "start_time": availability.start_time.isoformat(),
            "end_time": availability.end_time.isoformat(),
            "status": availability.status
        }

# Test scenarios:
# 1. Test successful availability sync with 200 response
# 2. Test retry logic on network errors
# 3. Test handling of invalid API keys (401 responses)
# 4. Test payload formatting with multiple availability slots
# 5. Test reservation push with complete booking details