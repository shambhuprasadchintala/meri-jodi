import nodemailer from "nodemailer"
import { config } from "./config.js"

let transporter = null

const getTransporter = () => {
    if (transporter) return transporter

    const user = (config.smtp.user || "").trim()
    const pass = (config.smtp.pass || "").trim().replace(/\s+/g, "")

    if (user && pass) {
        const isGmail = config.smtp.host?.includes("gmail")
        transporter = nodemailer.createTransport(
            isGmail
                ? {
                      service: "gmail",
                      auth: { user, pass },
                  }
                : {
                      host: config.smtp.host,
                      port: config.smtp.port,
                      secure: config.smtp.port === 465,
                      auth: { user, pass },
                      connectionTimeout: 8000,
                      greetingTimeout: 8000,
                      socketTimeout: 10000,
                  }
        )
    } else {
        // Dev fallback simulated transporter
        transporter = {
            sendMail: async () => {
                return { messageId: "simulated-" + Date.now() }
            },
        }
    }

    return transporter
}

export const sendMail = async ({ email, subject, html, text }) => {
    // Always print prominent notification in console for testing convenience
    console.log("\n================ [EMAIL DISPATCH] ================")
    console.log(`To:      ${email}`)
    console.log(`Subject: ${subject}`)
    if (text) {
        console.log(`Body:    ${text}`)
    }
    console.log("==================================================\n")

    try {
        const client = getTransporter()
        const fromAddress = config.smtp.user
            ? `"${config.appName}" <${config.smtp.user}>`
            : `"${config.appName}" <no-reply@merijodi.com>`

        const result = await client.sendMail({
            from: fromAddress,
            to: email,
            replyTo: config.smtp.user || undefined,
            subject,
            html,
            text,
            headers: {
                "X-Priority": "1",
                "X-MSMail-Priority": "High",
                "Importance": "high",
            },
        })
        return result
    } catch (error) {
        console.warn(`[Live SMTP Notice] Could not deliver live email to ${email} (${error.message}).`)
        return { error: error.message }
    }
}

export default sendMail
