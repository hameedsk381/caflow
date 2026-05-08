import pytest

from app.integrations.base import (
    Provider,
    ProviderCircuitOpenError,
    ProviderConfig,
    ProviderError,
    ProviderTimeoutError,
)


class FakeProvider(Provider):
    name = "fake.test"

    async def _ping(self) -> bool:
        return True


def test_provider_requires_name():
    class Unnamed(Provider):
        async def _ping(self) -> bool:
            return True

    with pytest.raises(TypeError, match="name"):
        Unnamed(ProviderConfig(api_key="x"))


def test_provider_config_holds_api_key():
    cfg = ProviderConfig(api_key="secret", base_url="https://api.example.com")
    p = FakeProvider(cfg)
    assert p.config.api_key == "secret"
    assert p.config.base_url == "https://api.example.com"


def test_exception_hierarchy():
    assert issubclass(ProviderTimeoutError, ProviderError)
    assert issubclass(ProviderCircuitOpenError, ProviderError)
