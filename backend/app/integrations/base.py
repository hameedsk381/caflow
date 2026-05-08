"""Provider abstraction shared by all external integrations.

Every concrete provider (GSP, MCA, OCR, WhatsApp, AI, payments) subclasses
``Provider`` and inherits cost metering, retry-on-reads, and circuit-breaker
behaviour added by decorators in sibling modules.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


class ProviderError(Exception):
    """Base for all provider-side failures."""


class ProviderTimeoutError(ProviderError):
    """The provider did not respond within the configured timeout."""


class ProviderCircuitOpenError(ProviderError):
    """The circuit breaker is open; call short-circuited."""


class ProviderAuthError(ProviderError):
    """Credentials were rejected. Surface to the firm — they need to re-auth."""


class ProviderRateLimitError(ProviderError):
    """The provider rate-limited us. Caller should back off."""


@dataclass
class ProviderConfig:
    api_key: str
    base_url: str | None = None
    timeout_s: float = 30.0
    extra: dict[str, Any] = field(default_factory=dict)


class Provider(ABC):
    """Base class for every external API integration.

    Subclasses MUST set ``name`` (e.g. ``"gsp.masters_india"``) — used as the
    row key in ``provider_call_log`` and for circuit-breaker scoping.
    """

    name: str = ""

    def __init__(self, config: ProviderConfig) -> None:
        if not self.name:
            raise TypeError(f"{type(self).__name__} must set class attribute 'name'")
        self.config = config

    @abstractmethod
    async def _ping(self) -> bool:
        """Cheap health check. Used by integration tests and admin status."""
        ...
