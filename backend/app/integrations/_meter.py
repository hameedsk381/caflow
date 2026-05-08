"""Cost metering decorator for Provider methods.

Wraps an async provider method and writes a ``provider_call_log`` row
regardless of outcome. The decorated method MAY accept ``_firm_id`` and
``_request_id`` kwargs which are stripped before invocation and recorded
on the log row.
"""

from __future__ import annotations

import time
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from functools import wraps
from typing import Any, TypeVar

from app.db.database import AsyncSessionLocal
from app.models.provider_call_log import ProviderCallLog

T = TypeVar("T")


async def _write_log(
    *,
    firm_id: Any,
    provider: str,
    endpoint: str,
    status: str,
    latency_ms: int,
    cost_paise: int,
    request_id: str | None,
    error_message: str | None,
) -> None:
    async with AsyncSessionLocal() as session:
        session.add(
            ProviderCallLog(
                firm_id=firm_id,
                provider=provider,
                endpoint=endpoint,
                status=status,
                latency_ms=latency_ms,
                cost_paise=cost_paise,
                request_id=request_id,
                error_message=error_message,
                created_at=datetime.now(UTC),
            )
        )
        await session.commit()


def metered(*, endpoint: str, cost_paise: int = 0) -> Callable:
    """Decorator: writes a provider_call_log row for each invocation.

    Strips ``_firm_id`` and ``_request_id`` from kwargs before calling the
    wrapped method. The wrapped method must be ``async``.
    """

    def deco(fn: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @wraps(fn)
        async def wrapper(self, *args: Any, **kwargs: Any) -> T:
            firm_id = kwargs.pop("_firm_id", None)
            request_id = kwargs.pop("_request_id", None)
            t0 = time.perf_counter()
            status = "ok"
            error_message: str | None = None
            try:
                return await fn(self, *args, **kwargs)
            except Exception as e:
                status = "error"
                error_message = str(e)[:1000]
                raise
            finally:
                latency_ms = int((time.perf_counter() - t0) * 1000)
                await _write_log(
                    firm_id=firm_id,
                    provider=self.name,
                    endpoint=endpoint,
                    status=status,
                    latency_ms=latency_ms,
                    cost_paise=cost_paise,
                    request_id=request_id,
                    error_message=error_message,
                )

        return wrapper

    return deco
