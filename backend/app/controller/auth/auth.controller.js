const { REFRESH_COOKIE } = require('../../constants')
const { createLoginSession } = require('../../service')
const { readCookie, sendSuccess } = require('../../util')

const getRequestContext = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
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
    (req, res, next) => registrationService
      .register(req.validatedBody)
      .then(async (user) => {
        await emailVerificationService.issue(user)
        return user
      })
      .then((user) => sendSuccess(res, {
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
    (req, res, next) => createLoginSession(sessionService, req.user, getRequestContext(req))
      .then((tokens) => {
        authCookie.set(res, tokens)
        return sendSuccess(res, {
          data: { user: req.user },
          message: 'Đăng nhập thành công.',
        })
      })
      .catch(next),
  )

  authEmail.post(
    '/verify-email',
    validateBody(validators.verifyEmail),
    (req, res, next) => emailVerificationService
      .verify(req.validatedBody.token)
      .then(() => sendSuccess(res, {
        message: 'Xác minh email thành công. Bạn có thể đăng nhập.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/resend-verification',
    rateLimiters.emailVerification,
    validateBody(validators.resendVerification),
    (req, res, next) => emailVerificationService
      .resend(req.validatedBody.email)
      .then(() => sendSuccess(res, {
        message: 'Nếu tài khoản đang chờ xác minh, email mới sẽ được gửi trong ít phút.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/google/start',
    rateLimiters.login,
    validateBody(validators.googleStart),
    (req, res, next) => googleAuthService
      .start(req.validatedBody, { ip: req.ip })
      .then((challenge) => sendSuccess(res, {
        data: challenge,
        message: 'Mã xác minh đã được gửi đến Gmail của bạn.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/google/complete',
    rateLimiters.login,
    validateBody(validators.googleComplete),
    (req, res, next) => googleAuthService
      .complete(req.validatedBody)
      .then(async (user) => ({
        tokens: await sessionService.issue(user, getRequestContext(req)),
        user,
      }))
      .then(({ tokens, user }) => {
        authCookie.set(res, tokens)
        return sendSuccess(res, {
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
    (req, res, next) => googleAuthService
      .resend(req.validatedBody)
      .then((result) => sendSuccess(res, {
        data: result,
        message: 'Mã xác minh mới đã được gửi đến Gmail của bạn.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/refresh',
    rateLimiters.refresh,
    (req, res, next) => sessionService
      .rotate(readCookie(req, REFRESH_COOKIE), getRequestContext(req))
      .then((result) => {
        authCookie.set(res, result.tokens)
        return sendSuccess(res, {
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
    (req, res, next) => passwordResetService
      .request(req.validatedBody.email)
      .then(() => sendSuccess(res, {
        message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi trong ít phút.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/reset-password',
    validateBody(validators.resetPassword),
    (req, res, next) => passwordResetService
      .reset(req.validatedBody)
      .then(() => {
        authCookie.clear(res)
        return sendSuccess(res, {
          message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
        })
      })
      .catch(next),
  )

  authEmail.get(
    '/me',
    authMiddleware.authenticateJwt,
    (req, res) => sendSuccess(res, {
      data: { user: req.user },
    }),
  )

  authEmail.post(
    '/logout',
    (req, res, next) => sessionService
      .revoke(readCookie(req, REFRESH_COOKIE))
      .then(() => {
        authCookie.clear(res)
        return sendSuccess(res, {
          message: 'Đăng xuất thành công.',
        })
      })
      .catch(next),
  )
}

module.exports = { initAuthEmailController }
