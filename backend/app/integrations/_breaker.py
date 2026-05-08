"""Circuit-breaker decorator scoped per provider name.

Once ``fail_max`` failures occur within ``reset_timeout`` seconds, further
calls fast-fail with ``ProviderCircuitOpenError`` until the timeout elapses.

Hand-rolled async breaker — pybreaker 1.x's ``call_async`` is tornado-based
and not compatible with asyncio.
"""
from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from functools import wraps
from typing import Awaitable, Callable, TypeVar

from app.integrations.base import ProviderCircuitOpenError

T = TypeVar("T")


@dataclass
class _CircuitState:
    fail_max: int
    reset_timeout: float
    failures: int = 0
    opened_at: float | None = None
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    def is_open(self) -> bool:
        if self.opened_at is None:
            return False
        if time.monotonic() - self.opened_at >= self.reset_timeout:
            # half-open: let the next call through; reset on success in record_success
            return False
        return True

    def record_failure(self) -> None:
        self.failures += 1
        if self.failures >= self.fail_max:
            self.opened_at = time.monotonic()

    def record_success(self) -> None:
        self.failures = 0
        self.opened_at = None


_BREAKERS: dict[str, _CircuitState] = {}


def get_breaker(
    name: str,
    *,
    fail_max: int = 5,
    reset_timeout: int = 60,
) -> _CircuitState:
    if name not in _BREAKERS:
        _BREAKERS[name] = _CircuitState(fail_max=fail_max, reset_timeout=float(reset_timeout))
    return _BREAKERS[name]


def breaker(
    *,
    name: str,
    fail_max: int = 5,
    reset_timeout: int = 60,
) -> Callable:
    """Decorator: scope an async function under a named circuit breaker."""
    state = get_breaker(name, fail_max=fail_max, reset_timeout=reset_timeout)

    def deco(fn: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @wraps(fn)
        async def wrapper(*args, **kwargs):
            async with state.lock:
                if state.is_open():
                    raise ProviderCircuitOpenError(f"circuit '{name}' open")
            try:
                result = await fn(*args, **kwargs)
            except Exception:
                async with state.lock:
                    state.record_failure()
                raise
            else:
                async with state.lock:
                    state.record_success()
                return result

        return wrapper

    return deco
