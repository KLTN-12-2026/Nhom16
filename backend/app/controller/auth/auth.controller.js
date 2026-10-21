const createAuthController = ({ registrationService, validateRegisterPayload }) => ({
  async register(request, response, next) {
    try {
      const payload = await validateRegisterPayload(request.body)
      const user = await registrationService.register(payload, { ip: request.ip })

      return response.status(201).json({
        success: true,
        data: { user },
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      })
    } catch (error) {
      return next(error)
    }
  },
})

module.exports = { createAuthController }
