import numpy as np


# ========================================
# NORMALISE WEIGHTS
# ========================================

def normalise_weights(
    weights,
    number_of_assets,
):
    if weights is None:

        return np.full(
            number_of_assets,
            1.0 / number_of_assets,
        )


    weights = np.asarray(
        weights,
        dtype=float,
    )


    if len(weights) != number_of_assets:

        raise ValueError(
            "Reference weights must match "
            "the number of assets."
        )


    if np.any(weights < 0):

        raise ValueError(
            "Reference weights cannot be negative."
        )


    total = float(
        weights.sum()
    )


    if total <= 0:

        raise ValueError(
            "Reference weights must sum "
            "to a positive value."
        )


    return weights / total


# ========================================
# IMPLIED EQUILIBRIUM RETURNS
# ========================================

def implied_equilibrium_returns(
    covariance_matrix,
    reference_weights,
    risk_aversion=2.5,
):
    """
    Black-Litterman equilibrium prior:

        Pi = delta * Sigma * w

    where:
        delta = risk aversion
        Sigma = covariance matrix
        w = reference portfolio weights
    """

    covariance_matrix = np.asarray(
        covariance_matrix,
        dtype=float,
    )

    reference_weights = np.asarray(
        reference_weights,
        dtype=float,
    )


    return (
        risk_aversion
        * covariance_matrix
        @ reference_weights
    )


# ========================================
# SENTIMENT VIEWS
# ========================================

def build_sentiment_views(
    tickers,
    prior_returns,
    covariance_matrix,
    ticker_sentiment,
    tau=0.05,
    view_scale=0.06,
):
    """
    Build absolute Black-Litterman views.

    Q = prior return + sentiment tilt

    Omega increases when confidence or
    news coverage is weak.
    """

    number_of_assets = len(
        tickers
    )


    prior_returns = np.asarray(
        prior_returns,
        dtype=float,
    )


    covariance_matrix = np.asarray(
        covariance_matrix,
        dtype=float,
    )


    P = np.eye(
        number_of_assets
    )


    Q = np.zeros(
        number_of_assets
    )


    effective_confidences = np.zeros(
        number_of_assets
    )


    view_details = []


    tau_covariance = (
        tau
        * covariance_matrix
    )


    prior_view_variance = np.diag(
        tau_covariance
    )


    omega_diagonal = np.zeros(
        number_of_assets
    )


    for index, ticker in enumerate(
        tickers
    ):

        result = ticker_sentiment.get(
            ticker,
            {},
        )


        score = float(
            result.get(
                "sentiment_score",
                0.0,
            )
        )


        score = float(
            np.clip(
                score,
                -1.0,
                1.0,
            )
        )


        confidence = float(
            result.get(
                "confidence",
                0.0,
            )
        )


        article_count = int(
            result.get(
                "article_count",
                0,
            )
        )


        coverage_factor = min(
            1.0,
            article_count / 5.0,
        )


        effective_confidence = (
            confidence
            * coverage_factor
        )


        effective_confidence = float(
            np.clip(
                effective_confidence,
                0.05,
                0.95,
            )
        )


        sentiment_tilt = (
            view_scale
            * score
        )


        Q[index] = (
            prior_returns[index]
            + sentiment_tilt
        )


        effective_confidences[
            index
        ] = effective_confidence


        base_variance = max(
            float(
                prior_view_variance[
                    index
                ]
            ),
            1e-8,
        )


        omega_diagonal[
            index
        ] = (
            base_variance
            * (
                1.0
                - effective_confidence
            )
            / effective_confidence
        )


        view_details.append(
            {
                "ticker":
                    ticker,

                "prior_return":
                    float(
                        prior_returns[
                            index
                        ]
                    ),

                "sentiment_score":
                    score,

                "raw_confidence":
                    confidence,

                "article_count":
                    article_count,

                "effective_confidence":
                    effective_confidence,

                "sentiment_tilt":
                    sentiment_tilt,

                "view_return":
                    float(
                        Q[index]
                    ),
            }
        )


    Omega = np.diag(
        omega_diagonal
    )


    return (
        P,
        Q,
        Omega,
        view_details,
    )


# ========================================
# BLACK-LITTERMAN POSTERIOR
# ========================================

def black_litterman_posterior(
    prior_returns,
    covariance_matrix,
    P,
    Q,
    Omega,
    tau=0.05,
):
    """
    Posterior mean:

    [(tau Sigma)^-1 + P' Omega^-1 P]^-1
    [(tau Sigma)^-1 Pi + P' Omega^-1 Q]

    Pseudoinverse is used for numerical
    robustness.
    """

    prior_returns = np.asarray(
        prior_returns,
        dtype=float,
    )


    covariance_matrix = np.asarray(
        covariance_matrix,
        dtype=float,
    )


    P = np.asarray(
        P,
        dtype=float,
    )


    Q = np.asarray(
        Q,
        dtype=float,
    )


    Omega = np.asarray(
        Omega,
        dtype=float,
    )


    tau_covariance = (
        tau
        * covariance_matrix
    )


    inverse_tau_covariance = (
        np.linalg.pinv(
            tau_covariance
        )
    )


    inverse_omega = (
        np.linalg.pinv(
            Omega
        )
    )


    posterior_precision = (
        inverse_tau_covariance
        +
        P.T
        @ inverse_omega
        @ P
    )


    posterior_covariance_mean = (
        np.linalg.pinv(
            posterior_precision
        )
    )


    posterior_returns = (
        posterior_covariance_mean
        @ (
            inverse_tau_covariance
            @ prior_returns
            +
            P.T
            @ inverse_omega
            @ Q
        )
    )


    return posterior_returns


# ========================================
# COMPLETE MODEL
# ========================================

def run_black_litterman(
    tickers,
    covariance_matrix,
    ticker_sentiment,
    reference_weights=None,
    risk_aversion=2.5,
    tau=0.05,
    view_scale=0.06,
):
    number_of_assets = len(
        tickers
    )


    reference_weights = (
        normalise_weights(
            reference_weights,
            number_of_assets,
        )
    )


    prior_returns = (
        implied_equilibrium_returns(
            covariance_matrix,
            reference_weights,
            risk_aversion,
        )
    )


    (
        P,
        Q,
        Omega,
        view_details,
    ) = build_sentiment_views(
        tickers=tickers,
        prior_returns=prior_returns,
        covariance_matrix=(
            covariance_matrix
        ),
        ticker_sentiment=(
            ticker_sentiment
        ),
        tau=tau,
        view_scale=view_scale,
    )


    posterior_returns = (
        black_litterman_posterior(
            prior_returns=(
                prior_returns
            ),
            covariance_matrix=(
                covariance_matrix
            ),
            P=P,
            Q=Q,
            Omega=Omega,
            tau=tau,
        )
    )


    return {
        "reference_weights":
            reference_weights.tolist(),

        "prior_returns":
            prior_returns.tolist(),

        "view_returns":
            Q.tolist(),

        "posterior_returns":
            posterior_returns.tolist(),

        "omega_diagonal":
            np.diag(
                Omega
            ).tolist(),

        "views":
            view_details,
    }
