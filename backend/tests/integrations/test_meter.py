import pytest

from app.integrations._meter import metered
from app.integrations.base import Provider, ProviderConfig, ProviderError


class FakeProvider(Provider):
    name = "fake.test"

    async def _ping(self) -> bool:
        return True

    @metered(endpoint="echo", cost_paise=50)
    async def echo(self, msg: str) -> str:
        return msg

    @metered(endpoint="boom", cost_paise=10)
    async def boom(self) -> None:
        raise ProviderError("expected")


@pytest.mark.asyncio
async def test_metered_writes_ok_row(monkeypatch):
    rows: list[dict] = []

    async def fake_write(**kw):
        rows.append(kw)

    monkeypatch.setattr("app.integrations._meter._write_log", fake_write)

    p = FakeProvider(ProviderConfig(api_key="x"))
    out = await p.echo("hi", _firm_id="firm-uuid", _request_id="r1")

    assert out == "hi"
    assert len(rows) == 1
    assert rows[0]["status"] == "ok"
    assert rows[0]["provider"] == "fake.test"
    assert rows[0]["endpoint"] == "echo"
    assert rows[0]["cost_paise"] == 50
    assert rows[0]["firm_id"] == "firm-uuid"
    assert rows[0]["request_id"] == "r1"
    assert rows[0]["latency_ms"] >= 0


@pytest.mark.asyncio
async def test_metered_writes_error_row(monkeypatch):
    rows: list[dict] = []

    async def fake_write(**kw):
        rows.append(kw)

    monkeypatch.setattr("app.integrations._meter._write_log", fake_write)

    p = FakeProvider(ProviderConfig(api_key="x"))
    with pytest.raises(ProviderError):
        await p.boom(_firm_id="firm-uuid")

    assert len(rows) == 1
    assert rows[0]["status"] == "error"
    assert rows[0]["error_message"] == "expected"
    assert rows[0]["cost_paise"] == 10
