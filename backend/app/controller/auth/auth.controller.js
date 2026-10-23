const { sendSuccess } = require('../../util/response.helper')

const createAuthController = ({ authenticationService, authCookie, googleAuthService, registrationService }) => ({
  async register(request, response) {
    const user = await registrationService.register(request.validatedBody)
    return sendSuccess(response, {
      statusCode: 201,
      data: { user },
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
    })
  },
  async login(request, response) {
    authCookie.set(response, authenticationService.createAccessToken(request.user))
    return sendSuccess(response, { data: { user: request.user }, message: 'Đăng nhập thành công.' })
  },
  async google(request, response) {
    const result = await googleAuthService.authenticate(request.validatedBody, { ip: request.ip })
    authCookie.set(response, result.accessToken)
    return sendSuccess(response, { data: { user: result.user }, message: 'Đăng nhập Google thành công.' })
  },
  async me(request, response) {
    return sendSuccess(response, { data: { user: request.user } })
  },
  logout(request, response) {
    authCookie.clear(response)
    return sendSuccess(response, { message: 'Đăng xuất thành công.' })
  },
})

module.exports = { createAuthController }
