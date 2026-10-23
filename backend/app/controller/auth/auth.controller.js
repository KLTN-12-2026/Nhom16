const { sendSuccess } = require('../../util/response.helper')
const { REFRESH_COOKIE } = require('../../constants')
const { readCookie } = require('../../util/cookie.helper')
const { toAuthUser } = require('../../service/auth/authentication.service')

const requestContext = (request) => ({ ip: request.ip, userAgent: request.get('user-agent') })

const createAuthController = ({ authCookie, emailVerificationService, googleAuthService, passwordResetService, registrationService, sessionService }) => ({
  async register(request, response) {
    const user = await registrationService.register(request.validatedBody)
    await emailVerificationService.issue(user)
    return sendSuccess(response, {
      statusCode: 201,
      data: { user },
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
    })
  },
  async verifyEmail(request, response) {
    await emailVerificationService.verify(request.validatedBody.token)
    return sendSuccess(response, { message: 'Xác minh email thành công. Bạn có thể đăng nhập.' })
  },
  async resendVerification(request, response) {
    await emailVerificationService.resend(request.validatedBody.email)
    return sendSuccess(response, { message: 'Nếu tài khoản đang chờ xác minh, email mới sẽ được gửi trong ít phút.' })
  },
  async login(request, response) {
    authCookie.set(response, await sessionService.issue(request.user, requestContext(request)))
    return sendSuccess(response, { data: { user: request.user }, message: 'Đăng nhập thành công.' })
  },
  async googleStart(request, response) {
    const challenge = await googleAuthService.start(request.validatedBody, { ip: request.ip })
    return sendSuccess(response, { data: challenge, message: 'Mã xác minh đã được gửi đến Gmail của bạn.' })
  },
  async googleComplete(request, response) {
    const user = await googleAuthService.complete(request.validatedBody)
    authCookie.set(response, await sessionService.issue(user, requestContext(request)))
    return sendSuccess(response, { data: { user }, message: 'Xác minh và đăng nhập Google thành công.' })
  },
  async googleResend(request, response) {
    const result = await googleAuthService.resend(request.validatedBody)
    return sendSuccess(response, { data: result, message: 'Mã xác minh mới đã được gửi đến Gmail của bạn.' })
  },
  async refresh(request, response) {
    const result = await sessionService.rotate(readCookie(request, REFRESH_COOKIE), requestContext(request))
    authCookie.set(response, result.tokens)
    return sendSuccess(response, { data: { user: toAuthUser(result.user) }, message: 'Làm mới phiên đăng nhập thành công.' })
  },
  async forgotPassword(request, response) {
    await passwordResetService.request(request.validatedBody.email)
    return sendSuccess(response, { message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi trong ít phút.' })
  },
  async resetPassword(request, response) {
    await passwordResetService.reset(request.validatedBody)
    authCookie.clear(response)
    return sendSuccess(response, { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' })
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
