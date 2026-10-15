const DEFAULT_API_BASE_URL =
  "http://127.0.0.1:8010";


function normaliseBaseUrl(
  value,
) {

  return String(
    value
    || DEFAULT_API_BASE_URL
  )
    .trim()
    .replace(
      /\/+$/,
      "",
    );
}


export const API_BASE_URL =
  normaliseBaseUrl(
    import.meta.env
      .VITE_API_BASE_URL
  );


export function apiUrl(
  path = "",
) {

  const suffix =
    String(
      path
      || ""
    );

  if (!suffix) {
    return API_BASE_URL;
  }


  return (
    API_BASE_URL
    + (
      suffix.startsWith("/")
        ? suffix
        : `/${suffix}`
    )
  );
}
