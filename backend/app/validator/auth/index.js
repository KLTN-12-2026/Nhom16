const emailVerification = require('./email-verification.validator')
const google = require('./google.validator')
const login = require('./login.validator')
const passwordReset = require('./password-reset.validator')
const register = require('./register.validator')

const authValidators = {
  forgotPassword: passwordReset.validateForgotPasswordPayload,
  googleComplete: google.validateGoogleCompletePayload,
  googleResend: google.validateGoogleResendPayload,
  googleStart: google.validateGoogleStartPayload,
  login: login.validateLoginPayload,
  register: register.validateRegisterPayload,
  resendVerification: emailVerification.validateResendVerificationPayload,
  resetPassword: passwordReset.validateResetPasswordPayload,
  verifyEmail: emailVerification.validateVerifyEmailPayload,
}

module.exports = {
  ...emailVerification,
  ...google,
  ...login,
  ...passwordReset,
  ...register,
  authValidators,
}
