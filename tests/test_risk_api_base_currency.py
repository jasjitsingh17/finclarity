from fastapi.testclient import TestClient

import backend.main as main_module


client = TestClient(
    main_module.app
)


def test_risk_api_forwards_base_currency(
    monkeypatch,
):

    seen = {}


    def fake_analyse_risk(
        **kwargs,
    ):

        seen.update(
            kwargs
        )

        return {
            "base_currency":
                kwargs[
                    "base_currency"
                ]
        }


    monkeypatch.setattr(
        main_module,
        "analyse_risk",
        fake_analyse_risk,
    )


    response = client.post(
        "/api/risk/analyse",
        json={
            "tickers":
                [
                    "AAA",
                    "BBB",
                ],

            "weights":
                [
                    0.6,
                    0.4,
                ],

            "benchmark":
                "SPY",

            "years":
                3,

            "risk_free_rate":
                0.04,

            "base_currency":
                "GBP",
        },
    )


    assert (
        response.status_code
        == 200
    )


    assert (
        seen[
            "base_currency"
        ]
        == "GBP"
    )


    assert (
        response.json()[
            "base_currency"
        ]
        == "GBP"
    )
