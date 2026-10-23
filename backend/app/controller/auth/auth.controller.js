const { sendSuccess } = require('../../util/response.helper')
const { REFRESH_COOKIE } = require('../../constants')
const { readCookie } = require('../../util/cookie.helper')
const { toAuthUser } = require('../../service/auth/authentication.service')

const requestContext = (request) => ({ ip: request.ip, userAgent: request.get('user-agent') })

const createAuthController = ({ authCookie, googleAuthService, registrationService, sessionService }) => ({
  async register(request, response) {
    const user = await registrationService.register(request.validatedBody)
    return sendSuccess(response, {
      statusCode: 201,
      data: { user },
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
    })
  },
  async login(request, response) {
    authCookie.set(response, await sessionService.issue(request.user, requestContext(request)))
    return sendSuccess(response, { data: { user: request.user }, message: 'Đăng nhập thành công.' })
  },
  async google(request, response) {
    const user = await googleAuthService.authenticate(request.validatedBody, { ip: request.ip })
    authCookie.set(response, await sessionService.issue(user, requestContext(request)))
    return sendSuccess(response, { data: { user }, message: 'Đăng nhập Google thành công.' })
  },
  async refresh(request, response) {
    const result = await sessionService.rotate(readCookie(request, REFRESH_COOKIE), requestContext(request))
    authCookie.set(response, result.tokens)
    return sendSuccess(response, { data: { user: toAuthUser(result.user) }, message: 'Làm mới phiên đăng nhập thành công.' })
  },
  async me(request, response) {
    return sendSuccess(response, { data: { user: request.user } })
  },
  async logout(request, response) {
    await sessionService.revoke(readCookie(request, REFRESH_COOKIE))
    authCookie.clear(response)
    return sendSuccess(response, { message: 'Đăng xuất thành công.' })
  },
})

module.exports = { createAuthController }
