const DEFAULT_API_URL = "http://localhost:5000"

// Accept a server origin or an existing API base without duplicating route prefixes.
export const resolveApiUrls = (configuredUrl) => {
  const base = (configuredUrl?.trim() || DEFAULT_API_URL).replace(/\/+$/, "")
  const root = base.replace(/\/api(?:\/v1|\/auth)?$/, "")

  return {
    apiBaseUrl: `${root}/api/v1`,
    authBaseUrl: `${root}/api/auth`,
    socketUrl: new URL(root).origin,
  }
}

const urls = resolveApiUrls(
  import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_BASE
)

export const API_BASE_URL = urls.apiBaseUrl
export const AUTH_BASE_URL = urls.authBaseUrl
export const SOCKET_URL = urls.socketUrl
// Render's free service can take over 50 seconds to wake after becoming idle.
export const API_TIMEOUT_MS = 65000
