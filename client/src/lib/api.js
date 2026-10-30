const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

export function apiUrl(path) {
  if (typeof path !== "string" || !path.startsWith("/api/")) {
    throw new Error(`API paths must start with "/api/": ${path}`);
  }

  if (import.meta.env.PROD && !configuredBaseUrl) {
    throw new Error("VITE_API_BASE_URL must be set for production API requests.");
  }

  return `${configuredBaseUrl}${path}`;
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}
