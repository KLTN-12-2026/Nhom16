const ACCESS_COOKIE = 'access_token'
const cookieOptions = (isProduction) => ({ httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax', maxAge: 15 * 60 * 1000, path: '/' })
const readCookie = (request, name) => {
  const entry = (request.headers.cookie || '').split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null
}

const createAuthController = ({ authenticationService, googleAuthService, registrationService, validateGooglePayload, validateLoginPayload, validateRegisterPayload, isProduction = false }) => ({
  async register(request, response, next) {
    try {
      const payload = await validateRegisterPayload(request.body)
      const user = await registrationService.register(payload, { ip: request.ip })

      return response.status(201).json({
        success: true,
        data: { user },
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      })
    } catch (error) {
      return next(error)
    }
  },
  async login(request, response, next) {
    try {
      const result = await authenticationService.login(await validateLoginPayload(request.body), { ip: request.ip })
      response.cookie(ACCESS_COOKIE, result.accessToken, cookieOptions(isProduction))
      return response.json({ success: true, data: { user: result.user }, message: 'Đăng nhập thành công.' })
    } catch (error) { return next(error) }
  },
  async google(request, response, next) {
    try {
      const result = await googleAuthService.authenticate(await validateGooglePayload(request.body), { ip: request.ip })
      response.cookie(ACCESS_COOKIE, result.accessToken, cookieOptions(isProduction))
      return response.json({ success: true, data: { user: result.user }, message: 'Đăng nhập Google thành công.' })
    } catch (error) { return next(error) }
  },
  async me(request, response, next) {
    try {
      const user = await authenticationService.getCurrentUser(readCookie(request, ACCESS_COOKIE))
      return response.json({ success: true, data: { user } })
    } catch (error) { return next(error) }
  },
  logout(request, response) {
    response.clearCookie(ACCESS_COOKIE, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax', path: '/' })
    return response.json({ success: true, data: null, message: 'Đăng xuất thành công.' })
  },
})

module.exports = { ACCESS_COOKIE, createAuthController, readCookie }
