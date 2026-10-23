const validateBody = (validator) => async (request, response, next) => {
  try {
    request.validatedBody = await validator(request.body)
    request.body = request.validatedBody
    return next()
  } catch (error) {
    return next(error)
  }
}

module.exports = { validateBody }
