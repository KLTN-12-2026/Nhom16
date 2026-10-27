const { REFRESH_COOKIE, ROLES } = require('../../constants')
const { clearAuthCookie, setAuthCookie } = require('../../middleware/auth/auth-cookie.middleware')
const { authenticateJwt } = require('../../middleware/auth/passport.middleware')
const { verifyRecaptcha } = require('../../middleware/auth/recaptcha.middleware')
const {
  emailVerificationRateLimit,
  forgotPasswordRateLimit,
  loginRateLimit,
  refreshRateLimit,
} = require('../../middleware/rate-limit/auth-rate-limit.middleware')
const { validateBody } = require('../../middleware/validation/validate.middleware')
const { toAuthUser, userSignIn } = require('../../service/auth/authentication.service')
const {
  issueEmailVerification,
  resendEmailVerification,
  verifyEmail,
} = require('../../service/auth/email-verification.service')
const {
  completeGoogleAuth,
  resendGoogleAuthCode,
  startGoogleAuth,
} = require('../../service/auth/google-auth.service')
const { requestPasswordReset, resetPassword } = require('../../service/auth/password-reset.service')
const { registerUser } = require('../../service/auth/registration.service')
const { issueSession, refreshSession, revokeSession } = require('../../service/auth/session.service')
const { readCookie, sendSuccess } = require('../../util')
const {
  validateResendVerificationPayload,
  validateVerifyEmailPayload,
} = require('../../validator/auth/email-verification.validator')
const {
  validateGoogleCompletePayload,
  validateGoogleResendPayload,
  validateGoogleStartPayload,
} = require('../../validator/auth/google.validator')
const { validateLoginPayload } = require('../../validator/auth/login.validator')
const {
  validateForgotPasswordPayload,
  validateResetPasswordPayload,
} = require('../../validator/auth/password-reset.validator')
const { validateRegisterPayload } = require('../../validator/auth/register.validator')

const getRequestContext = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

const initAuthEmailController = (authEmail) => {
  authEmail.post(
    '/register',
    validateBody(validateRegisterPayload),
    verifyRecaptcha('register'),
    (req, res, next) => registerUser(req.validatedBody)
      .then(async (user) => {
        await issueEmailVerification(user)
        return user
      })
      .then((user) => sendSuccess(res, {
        statusCode: 201,
        data: { user },
        message: user.role === ROLES.EMPLOYER
          ? 'Đã gửi hồ sơ đăng ký doanh nghiệp của bạn và đang chờ admin xét duyệt. Vui lòng kiểm tra email để xác thực tài khoản.'
          : 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/login',
    loginRateLimit,
    validateBody(validateLoginPayload),
    (req, res, next) => userSignIn(req.body, getRequestContext(req))
      .then(({ tokens, user }) => {
        setAuthCookie(res, tokens)
        return sendSuccess(res, {
          data: { user },
          message: 'Đăng nhập thành công.',
        })
      })
      .catch(next),
  )

  authEmail.post(
    '/verify-email',
    validateBody(validateVerifyEmailPayload),
    (req, res, next) => verifyEmail(req.validatedBody.token)
      .then(() => sendSuccess(res, {
        message: 'Xác minh email thành công. Bạn có thể đăng nhập.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/resend-verification',
    emailVerificationRateLimit,
    validateBody(validateResendVerificationPayload),
    (req, res, next) => resendEmailVerification(req.validatedBody.email)
      .then(() => sendSuccess(res, {
        message: 'Nếu tài khoản đang chờ xác minh, email mới sẽ được gửi trong ít phút.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/google/start',
    loginRateLimit,
    validateBody(validateGoogleStartPayload),
    (req, res, next) => startGoogleAuth(req.validatedBody, { ip: req.ip })
      .then((challenge) => sendSuccess(res, {
        data: challenge,
        message: 'Mã xác minh đã được gửi đến Gmail của bạn.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/google/complete',
    loginRateLimit,
    validateBody(validateGoogleCompletePayload),
    (req, res, next) => completeGoogleAuth(req.validatedBody)
      .then(async (user) => ({
        tokens: await issueSession(user, getRequestContext(req)),
        user,
      }))
      .then(({ tokens, user }) => {
        setAuthCookie(res, tokens)
        return sendSuccess(res, {
          data: { user },
          message: 'Xác minh và đăng nhập Google thành công.',
        })
      })
      .catch(next),
  )

  authEmail.post(
    '/google/resend',
    loginRateLimit,
    validateBody(validateGoogleResendPayload),
    (req, res, next) => resendGoogleAuthCode(req.validatedBody)
      .then((result) => sendSuccess(res, {
        data: result,
        message: 'Mã xác minh mới đã được gửi đến Gmail của bạn.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/refresh',
    refreshRateLimit,
    (req, res, next) => refreshSession(readCookie(req, REFRESH_COOKIE), getRequestContext(req))
      .then((result) => {
        setAuthCookie(res, result.tokens)
        return sendSuccess(res, {
          data: { user: toAuthUser(result.user) },
          message: 'Làm mới phiên đăng nhập thành công.',
        })
      })
      .catch(next),
  )

  authEmail.post(
    '/forgot-password',
    forgotPasswordRateLimit,
    validateBody(validateForgotPasswordPayload),
    (req, res, next) => requestPasswordReset(req.validatedBody.email)
      .then(() => sendSuccess(res, {
        message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi trong ít phút.',
      }))
      .catch(next),
  )

  authEmail.post(
    '/reset-password',
    validateBody(validateResetPasswordPayload),
    (req, res, next) => resetPassword(req.validatedBody)
      .then(() => {
        clearAuthCookie(res)
        return sendSuccess(res, {
          message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
        })
      })
      .catch(next),
  )

  authEmail.get(
    '/me',
    authenticateJwt,
    (req, res) => sendSuccess(res, {
      data: { user: req.user },
    }),
  )

  authEmail.post(
    '/logout',
    (req, res, next) => revokeSession(readCookie(req, REFRESH_COOKIE))
      .then(() => {
        clearAuthCookie(res)
        return sendSuccess(res, {
          message: 'Đăng xuất thành công.',
        })
      })
      .catch(next),
  )
}

module.exports = { initAuthEmailController }
