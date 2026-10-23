const createRecaptchaMiddleware = ({ recaptchaVerifier }) => (action) => async (request, response, next) => {
  try {
    await recaptchaVerifier.verify({
      token: request.validatedBody?.recaptchaToken,
      action,
      remoteIp: request.ip,
    })
    return next()
  } catch (error) {
    return next(error)
  }
}

module.exports = { createRecaptchaMiddleware }
