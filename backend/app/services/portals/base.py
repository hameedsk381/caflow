from abc import ABC, abstractmethod
from typing import Dict, Any
from app.models.portal_sync import PortalType

class BasePortalScraper(ABC):
    @abstractmethod
    async def login(self, username: str, password: str) -> bool:
        """Authenticate with the portal."""
        pass

    @abstractmethod
    async def fetch_return_status(self, financial_year: str) -> Dict[str, Any]:
        """Fetch filing history."""
        pass

    @abstractmethod
    async def close(self):
        """Clean up resources."""
        pass
