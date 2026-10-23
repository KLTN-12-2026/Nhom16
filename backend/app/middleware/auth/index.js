module.exports = {
  ...require('./auth.middleware'),
  ...require('./passport.middleware'),
  ...require('./recaptcha.middleware'),
}
