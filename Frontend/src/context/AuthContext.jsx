import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { getMe, logoutUser } from "../api/authApi"

const AuthContext = createContext(null)

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuth must be used within AuthProvider")
    return ctx
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(() => localStorage.getItem("token"))
    const [loading, setLoading] = useState(true)

    const saveToken = useCallback((newToken) => {
        if (newToken) {
            localStorage.setItem("token", newToken)
        } else {
            localStorage.removeItem("token")
        }
        setToken(newToken)
    }, [])

    const signIn = useCallback((newToken, userData, newRefreshToken) => {
        saveToken(newToken)
        if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken)
        }
        setUser(userData)
    }, [saveToken])

    const signOut = useCallback(async () => {
        try {
            await logoutUser()
        } catch (e) {
            // ignore network errors on signout
        } finally {
            saveToken(null)
            localStorage.removeItem("refreshToken")
            setUser(null)
            try {
                localStorage.removeItem("merijodi_draft_profile")
                localStorage.removeItem("merijodi_draft_step")
                localStorage.removeItem("merijodi_draft_userId")
            } catch (_) {
                // ignore localStorage errors
            }
        }
    }, [saveToken])

    const updateUser = useCallback((updatedFields) => {
        setUser((prev) => (prev ? { ...prev, ...updatedFields } : updatedFields))
    }, [])

    const refreshUser = useCallback(async () => {
        try {
            const data = await getMe()
            const fetchedUser = data.user ?? data
            setUser(fetchedUser)
            return fetchedUser
        } catch (err) {
            return null
        }
    }, [])

    useEffect(() => {
        if (!token) {
            setLoading(false)
            return
        }

        let cancelled = false
        getMe()
            .then((data) => {
                if (!cancelled) {
                    setUser(data.user ?? data)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    saveToken(null)
                    setUser(null)
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [token, saveToken])

    useEffect(() => {
        const handleAuthLogout = () => {
            saveToken(null)
            localStorage.removeItem("refreshToken")
            setUser(null)
        }
        window.addEventListener("auth:logout", handleAuthLogout)
        return () => window.removeEventListener("auth:logout", handleAuthLogout)
    }, [saveToken])

    const isAuth = Boolean(token)

    return (
        <AuthContext.Provider value={{ user, token, isAuth, loading, signIn, signOut, logOut: signOut, refreshUser, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext
