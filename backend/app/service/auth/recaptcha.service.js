const { ApiError } = require('../../util')

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'

const createRecaptchaVerifier = ({ fetchImpl = global.fetch, secretKey, minimumScore = 0.5, allowedHostnames = [] }) => ({
  async verify({ token, action, remoteIp }) {
    if (!token || !secretKey) {
      throw new ApiError(400, 'Không thể xác minh yêu cầu. Vui lòng thử lại.', 'RECAPTCHA_FAILED')
    }

    const body = new URLSearchParams({ secret: secretKey, response: token })
    if (remoteIp) body.set('remoteip', remoteIp)

    let result
    try {
      const response = await fetchImpl(VERIFY_URL, { method: 'POST', body })
      if (!response.ok) throw new Error(`reCAPTCHA responded with ${response.status}`)
      result = await response.json()
    } catch (error) {
      throw new ApiError(503, 'Dịch vụ xác minh đang bận. Vui lòng thử lại.', 'RECAPTCHA_UNAVAILABLE')
    }

    const hostnameAllowed = allowedHostnames.length === 0 || allowedHostnames.includes(result.hostname)
    const isValid = result.success === true && result.action === action && Number(result.score) >= minimumScore && hostnameAllowed

    if (!isValid) {
      throw new ApiError(400, 'Không thể xác minh yêu cầu. Vui lòng thử lại.', 'RECAPTCHA_FAILED')
    }

    return { hostname: result.hostname, score: Number(result.score) }
  },
})

module.exports = { createRecaptchaVerifier }
