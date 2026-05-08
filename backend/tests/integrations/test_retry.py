import pytest

from app.integrations._retry import retry_reads
from app.integrations.base import (
    ProviderError,
    ProviderRateLimitError,
    ProviderTimeoutError,
)


@pytest.mark.asyncio
async def test_retries_on_timeout_then_succeeds():
    calls = {"n": 0}

    @retry_reads(max_attempts=3, initial_wait=0.01, max_wait=0.05)
    async def fn():
        calls["n"] += 1
        if calls["n"] < 3:
            raise ProviderTimeoutError("nope")
        return "ok"

    assert await fn() == "ok"
    assert calls["n"] == 3


@pytest.mark.asyncio
async def test_retries_on_rate_limit():
    calls = {"n": 0}

    @retry_reads(max_attempts=2, initial_wait=0.01, max_wait=0.05)
    async def fn():
        calls["n"] += 1
        if calls["n"] < 2:
            raise ProviderRateLimitError("slow down")
        return "ok"

    assert await fn() == "ok"


@pytest.mark.asyncio
async def test_does_not_retry_on_unknown_error():
    calls = {"n": 0}

    @retry_reads(max_attempts=3, initial_wait=0.01, max_wait=0.05)
    async def fn():
        calls["n"] += 1
        raise ProviderError("permanent")

    with pytest.raises(ProviderError):
        await fn()
    assert calls["n"] == 1


@pytest.mark.asyncio
async def test_gives_up_after_max_attempts():
    calls = {"n": 0}

    @retry_reads(max_attempts=3, initial_wait=0.01, max_wait=0.05)
    async def fn():
        calls["n"] += 1
        raise ProviderTimeoutError("forever")

    with pytest.raises(ProviderTimeoutError):
        await fn()
    assert calls["n"] == 3
