const { rateLimit } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')

const { ApiError } = require('../../util')

let authRateLimiters

const createLimiter = ({ redis, prefix, windowMs, limit, message }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: new RedisStore({
    prefix: `rate-limit:${prefix}:`,
    sendCommand: (...args) => redis.call(...args),
  }),
  handler: (request, response, next) => next(new ApiError(429, message, 'RATE_LIMITED')),
})

const createAuthRateLimiters = ({ redis, config }) => ({
  login: createLimiter({
    redis,
    prefix: 'login',
    windowMs: config.loginWindowMs,
    limit: config.loginMax,
    message: 'Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.',
  }),
  refresh: createLimiter({
    redis,
    prefix: 'refresh',
    windowMs: config.refreshWindowMs,
    limit: config.refreshMax,
    message: 'Yêu cầu làm mới phiên quá thường xuyên. Vui lòng thử lại sau.',
  }),
  forgotPassword: createLimiter({
    redis,
    prefix: 'forgot-password',
    windowMs: config.forgotPasswordWindowMs,
    limit: config.forgotPasswordMax,
    message: 'Bạn đã yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau.',
  }),
  emailVerification: createLimiter({
    redis,
    prefix: 'email-verification',
    windowMs: config.emailVerificationWindowMs,
    limit: config.emailVerificationMax,
    message: 'Bạn đã yêu cầu gửi email xác minh quá nhiều lần. Vui lòng thử lại sau.',
  }),
})

const initAuthRateLimiters = (dependencies) => {
  authRateLimiters = createAuthRateLimiters(dependencies)
  return authRateLimiters
}

const loginRateLimit = (req, res, next) => authRateLimiters.login(req, res, next)
const refreshRateLimit = (req, res, next) => authRateLimiters.refresh(req, res, next)
const forgotPasswordRateLimit = (req, res, next) => authRateLimiters.forgotPassword(req, res, next)
const emailVerificationRateLimit = (req, res, next) => authRateLimiters.emailVerification(req, res, next)

module.exports = {
  createAuthRateLimiters,
  emailVerificationRateLimit,
  forgotPasswordRateLimit,
  initAuthRateLimiters,
  loginRateLimit,
  refreshRateLimit,
}
