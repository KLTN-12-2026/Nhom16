module.exports = {
  ...require('./auth.module'),
  ...require('./password.service'),
  ...require('./recaptcha.service'),
  ...require('./registration.service'),
}
