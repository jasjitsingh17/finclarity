import numpy as np

from scipy.optimize import minimize


# ========================================
# PORTFOLIO METRICS
# ========================================

def portfolio_return(
    weights,
    expected_returns,
):
    """
    Calculate expected annual portfolio return.
    """

    weights = np.asarray(
        weights,
        dtype=float,
    )

    expected_returns = np.asarray(
        expected_returns,
        dtype=float,
    )

    return float(
        np.dot(
            weights,
            expected_returns,
        )
    )


def portfolio_volatility(
    weights,
    covariance_matrix,
):
    """
    Calculate annualised portfolio volatility.
    """

    weights = np.asarray(
        weights,
        dtype=float,
    )

    covariance_matrix = np.asarray(
        covariance_matrix,
        dtype=float,
    )

    variance = (
        weights.T
        @ covariance_matrix
        @ weights
    )

    return float(
        np.sqrt(
            max(variance, 0.0)
        )
    )


def sharpe_ratio(
    weights,
    expected_returns,
    covariance_matrix,
    risk_free_rate,
):
    """
    Calculate portfolio Sharpe ratio.
    """

    expected_return = portfolio_return(
        weights,
        expected_returns,
    )

    volatility = portfolio_volatility(
        weights,
        covariance_matrix,
    )

    if volatility <= 0:
        return 0.0

    return float(
        (
            expected_return
            - risk_free_rate
        )
        / volatility
    )


# ========================================
# MAXIMUM SHARPE
# ========================================

def maximise_sharpe(
    expected_returns,
    covariance_matrix,
    risk_free_rate=0.03,
    min_weight=0.0,
    max_weight=1.0,
):
    """
    Find long-only maximum Sharpe portfolio.
    """

    expected_returns = np.asarray(
        expected_returns,
        dtype=float,
    )

    covariance_matrix = np.asarray(
        covariance_matrix,
        dtype=float,
    )

    number_of_assets = len(
        expected_returns
    )

    initial_weights = np.full(
        number_of_assets,
        1 / number_of_assets,
    )


    def objective(weights):

        return -sharpe_ratio(
            weights,
            expected_returns,
            covariance_matrix,
            risk_free_rate,
        )


    constraints = (
        {
            "type": "eq",
            "fun": lambda weights:
                np.sum(weights) - 1,
        },
    )


    bounds = tuple(
        (
            min_weight,
            max_weight,
        )
        for _ in range(
            number_of_assets
        )
    )


    result = minimize(
        objective,
        initial_weights,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
    )


    if not result.success:
        raise ValueError(
            "Maximum Sharpe optimisation failed: "
            f"{result.message}"
        )


    weights = result.x


    return {
        "weights": weights.tolist(),

        "expected_return":
            portfolio_return(
                weights,
                expected_returns,
            ),

        "volatility":
            portfolio_volatility(
                weights,
                covariance_matrix,
            ),

        "sharpe_ratio":
            sharpe_ratio(
                weights,
                expected_returns,
                covariance_matrix,
                risk_free_rate,
            ),
    }


# ========================================
# MINIMUM VARIANCE
# ========================================

def minimise_variance(
    expected_returns,
    covariance_matrix,
    min_weight=0.0,
    max_weight=1.0,
):
    """
    Find long-only minimum variance portfolio.
    """

    expected_returns = np.asarray(
        expected_returns,
        dtype=float,
    )

    covariance_matrix = np.asarray(
        covariance_matrix,
        dtype=float,
    )

    number_of_assets = len(
        expected_returns
    )

    initial_weights = np.full(
        number_of_assets,
        1 / number_of_assets,
    )


    def objective(weights):

        return (
            portfolio_volatility(
                weights,
                covariance_matrix,
            )
            ** 2
        )


    constraints = (
        {
            "type": "eq",
            "fun": lambda weights:
                np.sum(weights) - 1,
        },
    )


    bounds = tuple(
        (
            min_weight,
            max_weight,
        )
        for _ in range(
            number_of_assets
        )
    )


    result = minimize(
        objective,
        initial_weights,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
    )


    if not result.success:
        raise ValueError(
            "Minimum variance optimisation failed: "
            f"{result.message}"
        )


    weights = result.x


    return {
        "weights": weights.tolist(),

        "expected_return":
            portfolio_return(
                weights,
                expected_returns,
            ),

        "volatility":
            portfolio_volatility(
                weights,
                covariance_matrix,
            ),
    }


# ========================================
# EFFICIENT FRONTIER
# ========================================

def efficient_frontier(
    expected_returns,
    covariance_matrix,
    points=25,
    min_weight=0.0,
    max_weight=1.0,
):
    """
    Generate efficient-frontier portfolios
    between minimum feasible return
    and maximum feasible return.
    """

    expected_returns = np.asarray(
        expected_returns,
        dtype=float,
    )

    covariance_matrix = np.asarray(
        covariance_matrix,
        dtype=float,
    )

    number_of_assets = len(
        expected_returns
    )

    initial_weights = np.full(
        number_of_assets,
        1 / number_of_assets,
    )


    minimum_return = float(
        np.min(
            expected_returns
        )
    )

    maximum_return = float(
        np.max(
            expected_returns
        )
    )


    target_returns = np.linspace(
        minimum_return,
        maximum_return,
        points,
    )


    bounds = tuple(
        (
            min_weight,
            max_weight,
        )
        for _ in range(
            number_of_assets
        )
    )


    frontier = []


    for target_return in target_returns:

        constraints = (
            {
                "type": "eq",
                "fun": lambda weights:
                    np.sum(weights) - 1,
            },

            {
                "type": "eq",
                "fun": (
                    lambda weights,
                    target=target_return:
                        portfolio_return(
                            weights,
                            expected_returns,
                        )
                        - target
                ),
            },
        )


        result = minimize(
            lambda weights:
                portfolio_volatility(
                    weights,
                    covariance_matrix,
                )
                ** 2,
            initial_weights,
            method="SLSQP",
            bounds=bounds,
            constraints=constraints,
        )


        if result.success:

            volatility = (
                portfolio_volatility(
                    result.x,
                    covariance_matrix,
                )
            )


            frontier.append(
                {
                    "expected_return":
                        float(
                            target_return
                        ),

                    "volatility":
                        float(
                            volatility
                        ),

                    "weights":
                        result.x.tolist(),
                }
            )


    return frontier