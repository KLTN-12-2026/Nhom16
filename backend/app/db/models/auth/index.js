module.exports = {
  ...require('./auth-identity.model'),
  ...require('./auth-session.model'),
  ...require('./password-reset-token.model'),
  ...require('./role.model'),
  ...require('./user-role.model'),
}
