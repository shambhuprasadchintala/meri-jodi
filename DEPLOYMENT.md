# Production authentication

The frontend is deployed at `https://meri-jodi-amber.vercel.app` and the Express backend at `https://meri-jodi-2.onrender.com`.

## Vercel

Use the `Frontend` root directory, `npm run build`, and the `dist` output directory.

```dotenv
VITE_API_BASE_URL=https://meri-jodi-2.onrender.com
VITE_APP_URL=https://meri-jodi-amber.vercel.app
VITE_GOOGLE_CLIENT_ID=<the public Google web client ID>
```

Frontend API configuration accepts either the backend origin or its `/api/v1` URL. Authentication uses `/api/auth`, protected APIs use `/api/v1`, and sockets use the backend origin. Changing a Vite environment variable requires a new build.

Never put Google client secrets, database credentials, signing secrets, or email API keys in frontend code or `VITE_*` variables. This browser Google flow only needs the public client ID.

## Render

Keep the existing database, Redis, signing, Google client ID, and media configuration. Set:

```dotenv
NODE_ENV=production
FRONTEND_DOMAIN=https://meri-jodi-amber.vercel.app
FRONTEND_URL=https://meri-jodi-amber.vercel.app
MAIL_PROVIDER=brevo
MAIL_FROM_EMAIL=<a verified sender email in Brevo>
BREVO_API_KEY=<enter the secret directly in Render>
```

`NODE_ENV=production` enables secure cross-site authentication cookies. Both frontend URL variables must reference the public website so verification and password-reset links open the correct app.

Render Free blocks outbound SMTP ports 25, 465, and 587, so Gmail SMTP cannot deliver registration or login codes from this service. The Brevo transport sends over HTTPS and does not require upgrading Render. Keep the API key on the backend only. Use a Brevo API key, not an SMTP key. Verify the sender and activate transactional email in Brevo before testing delivery. Provider quotas and account approval still apply.

Save the environment settings and deploy the updated backend. Never disable verification or return successful delivery when the email provider rejected the message.

## Google sign-in

Use the same Google web OAuth client ID in the Vercel frontend and Render backend. Its authorized JavaScript origins must include:

```text
https://meri-jodi-amber.vercel.app
```

Local origins can remain for development. The current frontend uses Google's popup access-token flow and posts its token to `/api/auth/google`; it does not use a backend redirect callback. Google verifies the identity before the backend accepts it. If Google's consent app remains in testing, the account signing in must be an allowed test user.

## Verify after deployment

1. Confirm `/api/v1/health` returns healthy and reports production.
2. In the browser, confirm registration, login, and Google requests use `/api/auth/...` and protected APIs use `/api/v1/...`.
3. Register with an email you control, confirm the email actually arrives, and complete verification.
4. Log out, sign in with email and password, receive the login code, and complete sign-in.
5. Sign in with Google, reload the app, and confirm the authenticated profile loads.
6. Verify refresh and logout. Browsers that block third-party cookies can still block Vercel-to-Render refresh even with `SameSite=None; Secure`; a same-site API domain or proxy is needed for those browsers.

Do not paste real tokens, passwords, verification codes, or full private user records into test logs or source control.

## References

- [Render Free limitations](https://render.com/docs/free)
- [Brevo transactional email API](https://developers.brevo.com/docs/send-a-transactional-email)
