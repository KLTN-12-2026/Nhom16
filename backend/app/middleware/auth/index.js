module.exports = {
  ...require('./auth-cookie.middleware'),
  ...require('./auth.middleware'),
  ...require('./passport.middleware'),
  ...require('./recaptcha.middleware'),
  ...require('./require-role.middleware'),
}
