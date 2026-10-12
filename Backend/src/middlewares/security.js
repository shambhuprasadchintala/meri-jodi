import helmet from "helmet"
import cors from "cors"
import express from "express"

/**
 * Configure and return security-related middleware
 * @param {Object} config - Application configuration
 * @returns {Object} Object containing security middleware functions
 */
export const configureSecurity = (config) => {
    return {
        // Helmet middleware for security headers
        helmetMiddleware: helmet(),

        // CORS middleware with configuration
        corsMiddleware: cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true)

                const allowedOrigins = config.security.cors.allowedOrigins || []
                const normalized = origin.replace(/\/$/, "")

                const isAllowed =
                    allowedOrigins.includes(origin) ||
                    allowedOrigins.includes(normalized) ||
                    (normalized.endsWith(".vercel.app") && normalized.includes("meri-jodi")) ||
                    (config.env !== "production" && (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")))

                if (isAllowed) {
                    return callback(null, true)
                }

                return callback(null, false)
            },
            methods: config.security.cors.allowedMethods,
            allowedHeaders: config.security.cors.allowedHeaders,
            exposedHeaders: config.security.cors.exposedHeaders,
            maxAge: config.security.cors.maxAge,
            credentials: true,
            optionsSuccessStatus: 204,
            preflightContinue: false,
        }),

        // URL-encoded parser with size limits
        urlencodedParserMiddleware: express.urlencoded({
            extended: true,
            limit: "1mb",
        }),
    }
}

export default configureSecurity
