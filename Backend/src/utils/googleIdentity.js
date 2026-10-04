const authError = (message, statusCode = 401) => Object.assign(new Error(message), { statusCode })

// Identity must come exclusively from a Google-verified token, never request profile fields.
export const verifyGoogleIdentity = async (
    { idToken, credential, accessToken },
    { clientId, client, fetchImpl = globalThis.fetch },
) => {
    if (!clientId) throw authError("Google sign-in is not configured on the server.", 503)
    const jwtToken = idToken || credential
    if (!jwtToken && !accessToken) throw authError("A Google authentication token is required.", 400)

    let identity
    try {
        if (jwtToken) {
            const ticket = await client.verifyIdToken({ idToken: jwtToken, audience: clientId })
            identity = ticket.getPayload()
        } else {
            // Bind implicit-flow tokens to our OAuth client before reading userinfo.
            const tokenInfo = await client.getTokenInfo(accessToken)
            if (tokenInfo.aud !== clientId || tokenInfo.expiry_date <= Date.now()) {
                throw authError("Invalid Google authentication token.")
            }
            const response = await fetchImpl("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` },
                signal: AbortSignal.timeout(8000),
            })
            if (!response.ok) throw authError("Invalid Google authentication token.")
            identity = await response.json()
            if (tokenInfo.sub && tokenInfo.sub !== identity.sub) throw authError("Invalid Google authentication token.")
        }
    } catch {
        throw authError("Google sign-in could not be verified. Please try again.")
    }

    if (!identity?.sub || !identity.email || identity.email_verified !== true) {
        throw authError("Google sign-in requires a verified email address.")
    }
    return {
        googleId: identity.sub,
        email: identity.email.toLowerCase().trim(),
        name: identity.name,
        avatar: identity.picture,
    }
}
