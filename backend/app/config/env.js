const path = require('node:path')

const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const toNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toNumber(process.env.DB_PORT, 3306),
    name: process.env.DB_NAME || 'tuyen_dung_ai',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    poolMax: toNumber(process.env.DB_POOL_MAX, 10),
    poolMin: toNumber(process.env.DB_POOL_MIN, 0),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'tuyen_dung_ai:development:',
  },
  mail: {
    host: process.env.SMTP_HOST || '',
    port: toNumber(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.MAIL_FROM || 'Tuyển Dụng Thông Minh <no-reply@example.com>',
  },
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  recaptcha: {
    secretKey: process.env.RECAPTCHA_SECRET_KEY || '',
    minimumScore: toNumber(process.env.RECAPTCHA_MIN_SCORE, 0.5),
  },
  auth: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET || '',
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    loginRateLimitWindowMs: toNumber(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 900000),
    loginRateLimitMax: toNumber(process.env.LOGIN_RATE_LIMIT_MAX, 10),
    refreshRateLimitWindowMs: toNumber(process.env.REFRESH_RATE_LIMIT_WINDOW_MS, 60000),
    refreshRateLimitMax: toNumber(process.env.REFRESH_RATE_LIMIT_MAX, 30),
    forgotPasswordRateLimitWindowMs: toNumber(process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS, 900000),
    forgotPasswordRateLimitMax: toNumber(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX, 5),
  },
})

module.exports = { env, toNumber }
