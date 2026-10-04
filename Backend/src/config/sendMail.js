import nodemailer from "nodemailer"
import { config } from "./config.js"
import { createMailSender } from "../utils/mailDelivery.js"

export const sendMail = createMailSender(config, {
    createTransport: (options) => nodemailer.createTransport(options),
})

export default sendMail
