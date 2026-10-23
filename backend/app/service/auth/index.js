module.exports = {
  ...require('./email-verification.service'),
  ...require('./password-reset.service'),
  ...require('./session.service'),
  ...require('./auth.module'),
  ...require('./authentication.service'),
  ...require('./google-auth.service'),
  ...require('./password.service'),
  ...require('./recaptcha.service'),
  ...require('./registration.service'),
  ...require('./token.service'),
}
