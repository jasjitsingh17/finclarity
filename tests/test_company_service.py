from backend import company_service


def test_identity_domain_parsing(
    monkeypatch,
):

    class FakeTicker:

        def __init__(
            self,
            ticker,
        ):
            self.ticker = ticker

        def get_info(
            self,
        ):
            return {
                "longName":
                    "Example Holdings PLC",

                "website":
                    "https://www.example.com",
            }


    monkeypatch.setattr(
        company_service.yf,
        "Ticker",
        FakeTicker,
    )


    company_service.get_company_identity.cache_clear()


    result = (
        company_service
        .get_company_identity(
            "TEST"
        )
    )


    assert (
        result["domain"]
        == "example.com"
    )


def test_noise_is_rejected():

    assert (
        company_service
        .company_content_relevance(
            "Windows App - Free download and install on Windows"
        )
        == 0.0
    )


    assert (
        company_service
        .company_content_relevance(
            "About Face ID advanced technology - Apple Support"
        )
        == 0.0
    )


def test_investor_content_is_accepted():

    score = (
        company_service
        .company_content_relevance(
            "Microsoft announces quarterly earnings and guidance"
        )
    )


    assert score >= 0.55


def test_company_update_category():

    assert (
        company_service
        .classify_company_update(
            "Apple announces quarterly earnings results"
        )
        == "Earnings"
    )


    assert (
        company_service
        .classify_company_update(
            "Company announces acquisition of Example Ltd"
        )
        == "M&A"
    )


def test_company_source_is_context_only():

    assert hasattr(
        company_service,
        "fetch_company_updates",
    )


def test_generic_guidance_is_not_financial_guidance():

    assert (
        company_service
        .company_content_relevance(
            "AI strategy - Guidance to set your organization's AI strategy - Microsoft Learn"
        )
        == 0.0
    )


def test_training_content_is_rejected():

    assert (
        company_service
        .company_content_relevance(
            "From guidance to action: Security fundamentals that materially reduce risk"
        )
        == 0.0
    )


def test_real_financial_guidance_is_accepted():

    assert (
        company_service
        .company_content_relevance(
            "Microsoft raises revenue guidance following quarterly earnings"
        )
        >= 0.55
    )
