module.exports = {
  ...require('./email-verification.validator'),
  ...require('./google.validator'),
  ...require('./login.validator'),
  ...require('./password-reset.validator'),
  ...require('./register.validator'),
}
