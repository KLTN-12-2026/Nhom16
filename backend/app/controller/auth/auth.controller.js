const { REFRESH_COOKIE } = require('../../constants')
const { readCookie, sendSuccess } = require('../../util')

const getRequestContext = (request) => ({
  ip: request.ip,
  userAgent: request.get('user-agent'),
})

const initAuthEmailController = (authEmail, dependencies) => {
  const {
    authCookie,
    authMiddleware,
    emailVerificationService,
    googleAuthService,
    passwordResetService,
    rateLimiters,
    registrationService,
    sessionService,
    toAuthUser,
    validateBody,
    validators,
    verifyRecaptcha,
  } = dependencies

  authEmail.post(
    '/register',
    validateBody(validators.register),
    verifyRecaptcha('register'),
    (request, response, next) => registrationService
      .register(request.validatedBody)
      .then(async (user) => {
        await emailVerificationService.issue(user)
        return user
      })
      .then((user) => sendSuccess(response, {
        statusCode: 201,
        data: { user },
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/login',
    rateLimiters.login,
    validateBody(validators.login),
    verifyRecaptcha('login'),
    authMiddleware.authenticateLocal,
    (request, response, next) => sessionService
      .issue(request.user, getRequestContext(request))
      .then((tokens) => {
        authCookie.set(response, tokens)
        return sendSuccess(response, {
          data: { user: request.user },
          message: 'Đăng nhập thành công.',
        })
      })
      .catch(next),
  )

  authEmail.post(
    '/verify-email',
    validateBody(validators.verifyEmail),
    (request, response, next) => emailVerificationService
      .verify(request.validatedBody.token)
      .then(() => sendSuccess(response, {
        message: 'Xác minh email thành công. Bạn có thể đăng nhập.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/resend-verification',
    rateLimiters.emailVerification,
    validateBody(validators.resendVerification),
    (request, response, next) => emailVerificationService
      .resend(request.validatedBody.email)
      .then(() => sendSuccess(response, {
        message: 'Nếu tài khoản đang chờ xác minh, email mới sẽ được gửi trong ít phút.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/google/start',
    rateLimiters.login,
    validateBody(validators.googleStart),
    (request, response, next) => googleAuthService
      .start(request.validatedBody, { ip: request.ip })
      .then((challenge) => sendSuccess(response, {
        data: challenge,
        message: 'Mã xác minh đã được gửi đến Gmail của bạn.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/google/complete',
    rateLimiters.login,
    validateBody(validators.googleComplete),
    (request, response, next) => googleAuthService
      .complete(request.validatedBody)
      .then(async (user) => ({
        tokens: await sessionService.issue(user, getRequestContext(request)),
        user,
      }))
      .then(({ tokens, user }) => {
        authCookie.set(response, tokens)
        return sendSuccess(response, {
          data: { user },
          message: 'Xác minh và đăng nhập Google thành công.',
        })
      })
      .catch(next),
  )

  authEmail.post(
    '/google/resend',
    rateLimiters.login,
    validateBody(validators.googleResend),
    (request, response, next) => googleAuthService
      .resend(request.validatedBody)
      .then((result) => sendSuccess(response, {
        data: result,
        message: 'Mã xác minh mới đã được gửi đến Gmail của bạn.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/refresh',
    rateLimiters.refresh,
    (request, response, next) => sessionService
      .rotate(readCookie(request, REFRESH_COOKIE), getRequestContext(request))
      .then((result) => {
        authCookie.set(response, result.tokens)
        return sendSuccess(response, {
          data: { user: toAuthUser(result.user) },
          message: 'Làm mới phiên đăng nhập thành công.',
        })
      })
      .catch(next),
  )

  authEmail.post(
    '/forgot-password',
    rateLimiters.forgotPassword,
    validateBody(validators.forgotPassword),
    (request, response, next) => passwordResetService
      .request(request.validatedBody.email)
      .then(() => sendSuccess(response, {
        message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi trong ít phút.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/reset-password',
    validateBody(validators.resetPassword),
    (request, response, next) => passwordResetService
      .reset(request.validatedBody)
      .then(() => {
        authCookie.clear(response)
        return sendSuccess(response, {
          message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
        })
      })
      .catch(next),
  )

  authEmail.get(
    '/me',
    authMiddleware.authenticateJwt,
    (request, response) => sendSuccess(response, {
      data: { user: request.user },
    }),
  )

  authEmail.post(
    '/logout',
    (request, response, next) => sessionService
      .revoke(readCookie(request, REFRESH_COOKIE))
      .then(() => {
        authCookie.clear(response)
        return sendSuccess(response, {
          message: 'Đăng xuất thành công.',
        })
      })
      .catch(next),
  )
}

module.exports = { initAuthEmailController }
