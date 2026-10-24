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

let recaptchaMiddleware

const initRecaptchaMiddleware = (dependencies) => {
  recaptchaMiddleware = createRecaptchaMiddleware(dependencies)
  return recaptchaMiddleware
}

const verifyRecaptcha = (action) => (req, res, next) => recaptchaMiddleware(action)(req, res, next)

module.exports = { createRecaptchaMiddleware, initRecaptchaMiddleware, verifyRecaptcha }
