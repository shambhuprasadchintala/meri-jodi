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
        const refreshRes = await axios.post(
          `${AUTH_BASE_URL}/refresh`,
          {},
          { withCredentials: true, timeout: API_TIMEOUT_MS }
        )
        const newToken =
          refreshRes.data?.data?.token ||
          refreshRes.data?.data?.accessToken
        if (newToken) {
          localStorage.setItem("token", newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return axiosInstance(originalRequest)
        }
      } catch (_refreshErr) {
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
