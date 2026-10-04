import assert from "node:assert/strict"
import test from "node:test"
import { resolveApiUrls, API_TIMEOUT_MS } from "../src/api/apiConfig.js"

const origin = "https://meri-jodi-2.onrender.com"

for (const base of [origin, `${origin}/`, `${origin}/api/v1`, `${origin}/api/v1/`, `${origin}/api`, `${origin}/api/auth/`, `  ${origin}/api/v1///  `]) {
  test(`production API endpoints work with ${base.trim()}`, () => {
    const urls = resolveApiUrls(base)
    assert.equal(`${urls.authBaseUrl}/register`, `${origin}/api/auth/register`)
    assert.equal(`${urls.authBaseUrl}/login`, `${origin}/api/auth/login`)
    assert.equal(`${urls.authBaseUrl}/google`, `${origin}/api/auth/google`)
    assert.equal(`${urls.authBaseUrl}/refresh`, `${origin}/api/auth/refresh`)
    assert.equal(`${urls.authBaseUrl}/admin-login`, `${origin}/api/auth/admin-login`)
    assert.equal(`${urls.apiBaseUrl}/profiles/me`, `${origin}/api/v1/profiles/me`)
    assert.equal(`${urls.apiBaseUrl}/admin/stats`, `${origin}/api/v1/admin/stats`)
    assert.equal(urls.socketUrl, origin)
  })
}

test("local development defaults to port 5000", () => {
  for (const value of [undefined, "", "   ", "http://localhost:5000/api/v1"]) {
    assert.deepEqual(resolveApiUrls(value), {
      apiBaseUrl: "http://localhost:5000/api/v1",
      authBaseUrl: "http://localhost:5000/api/auth",
      socketUrl: "http://localhost:5000",
    })
  }
})

test("API paths preserve reverse proxy prefixes while sockets use the origin", () => {
  assert.deepEqual(resolveApiUrls(`${origin}/backend/api/v1`), {
    apiBaseUrl: `${origin}/backend/api/v1`,
    authBaseUrl: `${origin}/backend/api/auth`,
    socketUrl: origin,
  })
})

test("requests allow time for a free Render service to wake", () => {
  assert.ok(API_TIMEOUT_MS >= 60000)
})
