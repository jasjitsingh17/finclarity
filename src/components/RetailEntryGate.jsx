import {
  Navigate,
} from "react-router-dom";


function hasSavedPortfolio() {

  try {

    const raw =
      localStorage.getItem(
        "finclarity_holdings"
      );


    if (!raw) {
      return false;
    }


    const holdings =
      JSON.parse(raw);


    return (
      Array.isArray(
        holdings
      )
      && holdings.length > 0
    );

  } catch {

    return false;
  }
}


function RetailEntryGate({
  children,
}) {

  if (
    !hasSavedPortfolio()
  ) {

    return (
      <Navigate
        to="/retail/portfolio?onboarding=1"
        replace
      />
    );
  }


  return children;
}


export default RetailEntryGate;
