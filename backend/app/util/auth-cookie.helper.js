const { ACCESS_COOKIE } = require('../constants')

const createAuthCookieHelper = ({ isProduction = false } = {}) => {
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  }

  return {
    clear(response) {
      response.clearCookie(ACCESS_COOKIE, options)
    },
    set(response, accessToken) {
      response.cookie(ACCESS_COOKIE, accessToken, { ...options, maxAge: 15 * 60 * 1000 })
    },
  }
}

module.exports = { createAuthCookieHelper }
