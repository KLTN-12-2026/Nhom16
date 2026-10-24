const { Passport } = require('passport')
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt')
const { Strategy: LocalStrategy } = require('passport-local')

const { ACCESS_COOKIE } = require('../../constants')
const { ApiError, readCookie, unauthorizedError } = require('../../util')

let passportMiddleware

const createPassportMiddleware = ({ authenticationService, jwtSecret }) => {
  const passport = new Passport()

  passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    session: false,
  }, async (email, password, done) => {
    try {
      return done(null, await authenticationService.authenticateLocal({ email, password }))
    } catch (error) {
      return done(error)
    }
  }))

  passport.use('jwt', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromExtractors([(request) => readCookie(request, ACCESS_COOKIE)]),
    secretOrKey: jwtSecret,
  }, async (payload, done) => {
    try {
      return done(null, await authenticationService.getCurrentUserFromPayload(payload))
    } catch (error) {
      return done(error)
    }
  }))

  const authenticate = (strategy) => (request, response, next) => passport.authenticate(
    strategy,
    { session: false },
    (error, user, info) => {
      if (error) return next(error)
      if (!user) return next(info instanceof ApiError ? info : unauthorizedError())
      request.user = user
      return next()
    },
  )(request, response, next)

  return {
    initialize: passport.initialize(),
    authenticateLocal: authenticate('local'),
    authenticateJwt: authenticate('jwt'),
  }
}

const initPassportMiddleware = (dependencies) => {
  passportMiddleware = createPassportMiddleware(dependencies)
  return passportMiddleware
}

const initializePassport = (req, res, next) => passportMiddleware.initialize(req, res, next)
const authenticateLocal = (req, res, next) => passportMiddleware.authenticateLocal(req, res, next)
const authenticateJwt = (req, res, next) => passportMiddleware.authenticateJwt(req, res, next)

module.exports = {
  authenticateJwt,
  authenticateLocal,
  createPassportMiddleware,
  initializePassport,
  initPassportMiddleware,
}
