from backend import filing_service


def test_base_symbol():

    assert (
        filing_service
        ._base_symbol(
            "AAPL"
        )
        == "AAPL"
    )

    assert (
        filing_service
        ._base_symbol(
            "AZN.L"
        )
        == "AZN"
    )


def test_important_forms():

    assert "10-K" in (
        filing_service
        .IMPORTANT_FORMS
    )

    assert "10-Q" in (
        filing_service
        .IMPORTANT_FORMS
    )

    assert "8-K" in (
        filing_service
        .IMPORTANT_FORMS
    )


def test_filing_age():

    result = (
        filing_service
        ._filing_age_hours(
            "2026-01-01"
        )
    )

    assert (
        result is None
        or result >= 0
    )
