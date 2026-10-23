const { ACCESS_COOKIE, REFRESH_COOKIE } = require('../constants')

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
      response.clearCookie(REFRESH_COOKIE, options)
    },
    set(response, { accessToken, refreshToken }) {
      response.cookie(ACCESS_COOKIE, accessToken, { ...options, maxAge: 15 * 60 * 1000 })
      response.cookie(REFRESH_COOKIE, refreshToken, { ...options, maxAge: 7 * 24 * 60 * 60 * 1000 })
    },
  }
}

module.exports = { createAuthCookieHelper }
