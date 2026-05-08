"""Retry decorator for idempotent (read) provider methods.

NEVER apply this to write methods — re-posting an already-accepted GST
return or invoice double-fires real-world side effects.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import TypeVar

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential_jitter,
)

from app.integrations.base import ProviderRateLimitError, ProviderTimeoutError

T = TypeVar("T")


def retry_reads(
    *,
    max_attempts: int = 3,
    initial_wait: float = 0.5,
    max_wait: float = 8.0,
) -> Callable:
    """Retry idempotent provider reads on transient failures only."""

    def deco(fn: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        return retry(
            reraise=True,
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential_jitter(initial=initial_wait, max=max_wait),
            retry=retry_if_exception_type((ProviderTimeoutError, ProviderRateLimitError)),
        )(fn)

    return deco
