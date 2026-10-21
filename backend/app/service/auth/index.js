module.exports = {
  ...require('./auth.module'),
  ...require('./authentication.service'),
  ...require('./google-auth.service'),
  ...require('./password.service'),
  ...require('./recaptcha.service'),
  ...require('./registration.service'),
  ...require('./token.service'),
}
