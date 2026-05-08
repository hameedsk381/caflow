import pytest

from app.integrations._breaker import breaker
from app.integrations.base import ProviderCircuitOpenError, ProviderError


@pytest.fixture(autouse=True)
def reset_breakers():
    from app.integrations._breaker import _BREAKERS

    _BREAKERS.clear()
    yield
    _BREAKERS.clear()


@pytest.mark.asyncio
async def test_breaker_opens_after_threshold():
    @breaker(name="t1", fail_max=2, reset_timeout=60)
    async def boom():
        raise ProviderError("boom")

    with pytest.raises(ProviderError):
        await boom()
    with pytest.raises(ProviderError):
        await boom()
    with pytest.raises(ProviderCircuitOpenError):
        await boom()


@pytest.mark.asyncio
async def test_breaker_independent_per_name():
    @breaker(name="a", fail_max=1, reset_timeout=60)
    async def a():
        raise ProviderError("a")

    @breaker(name="b", fail_max=5, reset_timeout=60)
    async def b():
        return "ok"

    with pytest.raises(ProviderError):
        await a()
    with pytest.raises(ProviderCircuitOpenError):
        await a()
    assert await b() == "ok"
