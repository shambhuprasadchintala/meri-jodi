import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { Check, X, AlertCircle, Info } from "lucide-react"

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = "info", duration = 3000) => {
        const id = Date.now().toString()
        setToasts((prev) => [...prev, { id, message, type, duration }])
    }, [])

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        toast={toast}
                        onRemove={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        const noop = () => {}
        return Object.assign(noop, { addToast: noop })
    }
    const fn = (message, type, duration) => context.addToast(message, type, duration)
    return Object.assign(fn, { addToast: context.addToast })
}

function Toast({ toast, onRemove }) {
    useEffect(() => {
        if (toast.duration > 0) {
            const timer = setTimeout(onRemove, toast.duration)
            return () => clearTimeout(timer)
        }
    }, [toast, onRemove])

    const icons = {
        success: <Check size={18} className="text-emerald-500" />,
        error: <AlertCircle size={18} className="text-red-500" />,
        info: <Info size={18} className="text-blue-500" />,
    }

    const bgs = {
        success: "bg-emerald-50 border-emerald-100",
        error: "bg-red-50 border-red-100",
        info: "bg-blue-50 border-blue-100",
    }

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full animate-in slide-in-from-right-8 fade-in duration-300 ${
                bgs[toast.type] || bgs.info
            }`}
        >
            <div className="mt-0.5 shrink-0">{icons[toast.type] || icons.info}</div>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 leading-snug">
                    {toast.message}
                </p>
            </div>
            <button
                onClick={onRemove}
                className="shrink-0 p-1 rounded-md text-gray-400 hover:bg-black/5 hover:text-gray-600 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    )
}
