const { env } = require('../../config')
const { createAuthCookieHelper } = require('../../util')

const authCookie = createAuthCookieHelper({
  isProduction: env.nodeEnv === 'production',
})

const clearAuthCookie = (res) => authCookie.clear(res)
const setAuthCookie = (res, tokens) => authCookie.set(res, tokens)

module.exports = { clearAuthCookie, setAuthCookie }
