import { config } from "./config.js"

export const getOtpHtml = ({ email, otp, appName = "MeriJodi" }) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${appName} Verification Code</title>
<style>
  body { margin: 0; padding: 0; background: #FFF5F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937; }
  .wrapper { width: 100%; padding: 40px 0; }
  .container { width: 90%; max-width: 540px; background: #FFFFFF; border-radius: 16px; margin: 0 auto; overflow: hidden; box-shadow: 0 10px 25px rgba(237, 84, 99, 0.08); border: 1px solid #FFE4E6; }
  .header { background: linear-gradient(135deg, #ED5463 0%, #D4384B 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
  .brand { font-size: 26px; font-weight: 800; letter-spacing: 0.5px; margin: 0; }
  .tagline { font-size: 13px; color: #FFE4E6; margin-top: 4px; }
  .content { padding: 36px 32px; text-align: center; }
  .title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 12px 0; }
  .subtitle { font-size: 15px; line-height: 1.6; color: #4B5563; margin: 0 0 24px 0; }
  .otp-box { background: #FFF1F2; border: 2px dashed #FDA4AF; border-radius: 12px; padding: 18px 24px; display: inline-block; margin: 0 auto 24px auto; }
  .otp { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #E11D48; font-family: 'Courier New', monospace; }
  .note { font-size: 13px; color: #9CA3AF; line-height: 1.6; margin: 0 0 8px 0; }
  .footer { background: #FAFAFA; padding: 20px; text-align: center; border-top: 1px solid #F3F4F6; font-size: 12px; color: #9CA3AF; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <h1 class="brand">${appName}</h1>
      <div class="tagline">Where Beautiful Stories Begin</div>
    </div>
    <div class="content">
      <h2 class="title">Login Verification Code</h2>
      <p class="subtitle">Hi there! Use the secure 6-digit verification code below to sign in to your <strong>${appName}</strong> account (<strong>${email}</strong>).</p>
      <div class="otp-box">
        <div class="otp">${otp}</div>
      </div>
      <p class="note">This code will expire in <strong>5 minutes</strong>.</p>
      <p class="note">If you did not request this code, please ignore this email.</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} ${appName}. All rights reserved.
    </div>
  </div>
</div>
</body>
</html>`
}

export const getVerifyEmailHtml = ({ email, token, otp, appName = "MeriJodi" }) => {
    const baseUrl = config.frontendUrl || config.frontendDomain || "http://localhost:5173"
    const verifyUrl = `${baseUrl.replace(/\/+$/, "")}/verify-email/${encodeURIComponent(token)}`

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Verify your ${appName} Account</title>
<style>
  body { margin: 0; padding: 0; background: #FFF5F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937; }
  .wrapper { width: 100%; padding: 40px 0; }
  .container { width: 90%; max-width: 540px; background: #FFFFFF; border-radius: 16px; margin: 0 auto; overflow: hidden; box-shadow: 0 10px 25px rgba(237, 84, 99, 0.08); border: 1px solid #FFE4E6; }
  .header { background: linear-gradient(135deg, #ED5463 0%, #D4384B 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
  .brand { font-size: 26px; font-weight: 800; letter-spacing: 0.5px; margin: 0; }
  .tagline { font-size: 13px; color: #FFE4E6; margin-top: 4px; }
  .content { padding: 36px 32px; text-align: center; }
  .title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 12px 0; }
  .subtitle { font-size: 15px; line-height: 1.6; color: #4B5563; margin: 0 0 24px 0; }
  .otp-box { background: #FFF1F2; border: 2px dashed #FDA4AF; border-radius: 12px; padding: 16px 24px; display: inline-block; margin: 0 auto 24px auto; }
  .otp { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #E11D48; font-family: 'Courier New', monospace; }
  .btn { display: inline-block; background: #ED5463; color: #FFFFFF !important; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(237, 84, 99, 0.3); margin-top: 8px; }
  .note { font-size: 13px; color: #9CA3AF; line-height: 1.6; margin-top: 24px; }
  .link-box { word-break: break-all; color: #ED5463; font-size: 12px; margin-top: 12px; }
  .footer { background: #FAFAFA; padding: 20px; text-align: center; border-top: 1px solid #F3F4F6; font-size: 12px; color: #9CA3AF; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <h1 class="brand">${appName}</h1>
      <div class="tagline">Where Beautiful Stories Begin</div>
    </div>
    <div class="content">
      <h2 class="title">Verify Your Email Address</h2>
      <p class="subtitle">Welcome to <strong>${appName}</strong>! Use your 6-digit verification code below, or click the button to verify your email (<strong>${email}</strong>) and activate your account.</p>
      ${
        otp
          ? `<div class="otp-box">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9B1C1C; margin-bottom: 6px; font-weight: 700;">Your 6-Digit Code</div>
        <div class="otp">${otp}</div>
      </div>`
          : ""
      }
      <div>
        <a class="btn" href="${verifyUrl}" target="_blank" rel="noopener">Verify My Account</a>
      </div>
      <p class="note">This verification link and code are valid for <strong>10 minutes</strong>.</p>
      <p class="note">If the button does not work, copy and paste this URL into your browser:</p>
      <div class="link-box"><a href="${verifyUrl}" style="color: #ED5463;">${verifyUrl}</a></div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} ${appName}. All rights reserved.
    </div>
  </div>
</div>
</body>
</html>`
}

export const getResetPasswordHtml = ({ email, token, otp, appName = "MeriJodi" }) => {
    const baseUrl = config.frontendUrl || config.frontendDomain || "http://localhost:5173"
    const resetUrl = `${baseUrl.replace(/\/+$/, "")}/reset-password/${encodeURIComponent(token)}`

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Reset your ${appName} Password</title>
<style>
  body { margin: 0; padding: 0; background: #FFF5F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937; }
  .wrapper { width: 100%; padding: 40px 0; }
  .container { width: 90%; max-width: 540px; background: #FFFFFF; border-radius: 16px; margin: 0 auto; overflow: hidden; box-shadow: 0 10px 25px rgba(237, 84, 99, 0.08); border: 1px solid #FFE4E6; }
  .header { background: linear-gradient(135deg, #ED5463 0%, #D4384B 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
  .brand { font-size: 26px; font-weight: 800; letter-spacing: 0.5px; margin: 0; }
  .tagline { font-size: 13px; color: #FFE4E6; margin-top: 4px; }
  .content { padding: 36px 32px; text-align: center; }
  .title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 12px 0; }
  .subtitle { font-size: 15px; line-height: 1.6; color: #4B5563; margin: 0 0 24px 0; }
  .otp-box { background: #FFF1F2; border: 2px dashed #FDA4AF; border-radius: 12px; padding: 16px 24px; display: inline-block; margin: 0 auto 24px auto; }
  .otp { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #E11D48; font-family: 'Courier New', monospace; }
  .btn { display: inline-block; background: #ED5463; color: #FFFFFF !important; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(237, 84, 99, 0.3); margin-top: 8px; }
  .note { font-size: 13px; color: #9CA3AF; line-height: 1.6; margin-top: 24px; }
  .link-box { word-break: break-all; color: #ED5463; font-size: 12px; margin-top: 12px; }
  .footer { background: #FAFAFA; padding: 20px; text-align: center; border-top: 1px solid #F3F4F6; font-size: 12px; color: #9CA3AF; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="container">
    <div class="header">
      <h1 class="brand">${appName}</h1>
      <div class="tagline">Where Beautiful Stories Begin</div>
    </div>
    <div class="content">
      <h2 class="title">Reset Your Password</h2>
      <p class="subtitle">We received a request to reset the password for your <strong>${appName}</strong> account (<strong>${email}</strong>). Use the 6-digit code or click below to choose a new password.</p>
      ${
        otp
          ? `<div class="otp-box">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9B1C1C; margin-bottom: 6px; font-weight: 700;">Password Reset Code</div>
        <div class="otp">${otp}</div>
      </div>`
          : ""
      }
      <div>
        <a class="btn" href="${resetUrl}" target="_blank" rel="noopener">Reset My Password</a>
      </div>
      <p class="note">This password reset link and code are valid for <strong>15 minutes</strong>.</p>
      <p class="note">If you did not request a password reset, you can safely ignore this email.</p>
      <div class="link-box"><a href="${resetUrl}" style="color: #ED5463;">${resetUrl}</a></div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} ${appName}. All rights reserved.
    </div>
  </div>
</div>
</body>
</html>`
}

export const getWelcomeHtml = ({ name, email, appName = "MeriJodi" }) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Welcome to ${appName}</title>
<style>
  body { margin: 0; padding: 0; background: #FFF5F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .container { max-width: 540px; background: #FFFFFF; border-radius: 16px; margin: 30px auto; overflow: hidden; border: 1px solid #FFE4E6; }
  .header { background: #ED5463; padding: 28px; text-align: center; color: white; }
  .content { padding: 32px; text-align: center; }
</style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${appName}</h1></div>
    <div class="content">
      <h2>Welcome, ${name || "Friend"}!</h2>
      <p>Your profile is ready. Start discovering verified matches today.</p>
    </div>
  </div>
</body>
</html>`
}

