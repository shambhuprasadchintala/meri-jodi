import app from "./src/app.js"
import connectDB from "./src/config/db.js"
import { config } from "./src/config/config.js"
import setupSocket from "./src/socket.js"
import { seedAdmin } from "./src/config/seedAdmin.js"

const startServer = async () => {
    await connectDB()
    await seedAdmin()

    const requestedPort = Number(config.port) || 5000

    const listenOnPort = (port) =>
        new Promise((resolve, reject) => {
            const srv = app.listen(port)
            srv.once("listening", () => {
                console.log(`Server running on port ${port}`)
                resolve(srv)
            })
            srv.once("error", (err) => {
                if (err.code === "EADDRINUSE" && port === requestedPort) {
                    console.warn(`Port ${port} is in use (e.g. macOS AirPlay). Falling back to port ${port + 1}...`)
                    srv.close?.()
                    const fallbackSrv = app.listen(port + 1)
                    fallbackSrv.once("listening", () => {
                        console.log(`Server running on port ${port + 1}`)
                        resolve(fallbackSrv)
                    })
                    fallbackSrv.once("error", reject)
                } else {
                    reject(err)
                }
            })
        })

    const server = await listenOnPort(requestedPort)

    // Attach Socket.io
    setupSocket(server)

    // Graceful shutdown
    const shutdown = async (signal) => {
        console.log(`\n${signal} received. Shutting down gracefully...`)
        server.close(async () => {
            console.log("HTTP server closed")
            const mongoose = await import("mongoose")
            await mongoose.default.connection.close()
            console.log("MongoDB connection closed")
            process.exit(0)
        })

        // Force shutdown after 10s
        setTimeout(() => {
            console.error("Forced shutdown after timeout")
            process.exit(1)
        }, 10000)
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"))
    process.on("SIGINT", () => shutdown("SIGINT"))
}

startServer().catch((err) => {
    console.error("Failed to start server:", err)
    process.exit(1)
})
