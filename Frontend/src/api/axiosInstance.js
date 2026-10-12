import axios from "axios"
import { API_BASE_URL, AUTH_BASE_URL, API_TIMEOUT_MS } from "./apiConfig"

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/")
    ) {
      originalRequest._retry = true
      try {
        const storedRefreshToken = localStorage.getItem("refreshToken")
        const refreshRes = await axios.post(
          `${AUTH_BASE_URL}/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true, timeout: API_TIMEOUT_MS }
        )
        const newToken =
          refreshRes.data?.data?.token ||
          refreshRes.data?.data?.accessToken
        const newRefreshToken = refreshRes.data?.data?.refreshToken

        if (newToken) {
          localStorage.setItem("token", newToken)
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken)
          }
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return axiosInstance(originalRequest)
        }
      } catch (_refreshErr) {
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        window.dispatchEvent(new CustomEvent("auth:logout"))
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/signup"
        ) {
          window.location.href = "/login"
        }
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
