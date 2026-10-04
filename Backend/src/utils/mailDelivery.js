// Injectable transports keep verification email checks independent of live accounts.
export const createMailSender = (config, { createTransport, fetchImpl = globalThis.fetch }) => {
    let transporter
    return async ({ email, subject, html, text }) => {
        const provider = (config.mail?.provider || "smtp").trim().toLowerCase()
        const fromEmail = (config.mail?.fromEmail || config.smtp.user || "").trim()

        try {
            if (provider === "brevo") {
                const apiKey = (config.mail?.brevoApiKey || "").trim()
                if (!apiKey || !fromEmail) {
                    return { error: "Email delivery is not configured. Set BREVO_API_KEY and MAIL_FROM_EMAIL." }
                }
                const response = await fetchImpl("https://api.brevo.com/v3/smtp/email", {
                    method: "POST",
                    headers: {
                        accept: "application/json",
                        "content-type": "application/json",
                        "api-key": apiKey,
                    },
                    body: JSON.stringify({
                        sender: { email: fromEmail, name: config.appName },
                        to: [{ email }],
                        subject,
                        ...(html ? { htmlContent: html } : { textContent: text }),
                    }),
                    signal: AbortSignal.timeout(10000),
                })
                if (!response.ok) {
                    return { error: `Email provider rejected delivery (HTTP ${response.status}). Check the API key, verified sender and transactional email activation.` }
                }
                const result = await response.json()
                if (!result.messageId) return { error: "Email provider did not confirm acceptance." }
                return { messageId: result.messageId }
            }

            if (provider !== "smtp") return { error: "Unsupported MAIL_PROVIDER. Use smtp or brevo." }

            const user = (config.smtp.user || "").trim()
            const pass = (config.smtp.pass || "").trim().replace(/\s+/g, "")
            if (!user || !pass) {
                if (config.env === "production") return { error: "Email delivery is not configured. Set SMTP_USER and SMTP_PASSWORD or configure Brevo." }
                return { messageId: `simulated-${Date.now()}`, simulated: true }
            }

            transporter ||= createTransport({
                host: config.smtp.host,
                port: config.smtp.port,
                secure: config.smtp.port === 465,
                auth: { user, pass },
                connectionTimeout: 5000,
                greetingTimeout: 5000,
                socketTimeout: 6000,
            })
            return await transporter.sendMail({
                from: { name: config.appName, address: fromEmail },
                to: email,
                replyTo: fromEmail,
                subject,
                html,
                text,
            })
        } catch (error) {
            // Transport errors can contain credentials or message contents. Never expose them.
            if (["TimeoutError", "AbortError"].includes(error?.name) || error?.code === "ETIMEDOUT") {
                return { error: "Email delivery timed out. Please try again later." }
            }
            return { error: "Email delivery failed. Please check the email provider configuration." }
        }
    }
}
