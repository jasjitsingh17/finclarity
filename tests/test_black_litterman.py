import numpy as np

from backend.black_litterman import (
    black_litterman_posterior,
    build_sentiment_views,
    implied_equilibrium_returns,
    normalise_weights,
)


def test_weights_normalise():

    weights = normalise_weights(
        [2, 1],
        2,
    )

    assert np.isclose(
        weights.sum(),
        1.0,
    )


def test_equilibrium_returns_shape():

    covariance = np.array(
        [
            [0.04, 0.01],
            [0.01, 0.03],
        ]
    )

    result = implied_equilibrium_returns(
        covariance,
        [0.5, 0.5],
        2.5,
    )

    assert result.shape == (2,)


def test_sentiment_views():

    tickers = [
        "AAA",
        "BBB",
    ]

    prior = np.array(
        [
            0.08,
            0.07,
        ]
    )

    covariance = np.array(
        [
            [0.04, 0.01],
            [0.01, 0.03],
        ]
    )

    sentiment = {

        "AAA": {
            "sentiment_score":
                0.5,

            "confidence":
                0.8,

            "article_count":
                5,
        },

        "BBB": {
            "sentiment_score":
                -0.5,

            "confidence":
                0.8,

            "article_count":
                5,
        },
    }

    P, Q, Omega, details = (
        build_sentiment_views(
            tickers,
            prior,
            covariance,
            sentiment,
        )
    )

    assert P.shape == (2, 2)

    assert Q[0] > prior[0]

    assert Q[1] < prior[1]

    assert Omega.shape == (2, 2)

    assert len(details) == 2


def test_posterior_is_finite():

    prior = np.array(
        [
            0.08,
            0.07,
        ]
    )

    covariance = np.array(
        [
            [0.04, 0.01],
            [0.01, 0.03],
        ]
    )

    P = np.eye(2)

    Q = np.array(
        [
            0.11,
            0.04,
        ]
    )

    Omega = np.diag(
        [
            0.001,
            0.001,
        ]
    )

    posterior = (
        black_litterman_posterior(
            prior,
            covariance,
            P,
            Q,
            Omega,
        )
    )

    assert posterior.shape == (2,)

    assert np.isfinite(
        posterior
    ).all()
