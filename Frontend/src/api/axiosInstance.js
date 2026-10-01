import axios from "axios"

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"
const AUTH_BASE = BASE.replace(/\/api\/v1\/?$/, "/api/auth")

const axiosInstance = axios.create({
  baseURL: BASE,
  timeout: 15000,
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
          `${AUTH_BASE}/refresh`,
          {},
          { withCredentials: true }
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
