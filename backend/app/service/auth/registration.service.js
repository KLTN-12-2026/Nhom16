const { PUBLIC_REGISTRATION_ROLES } = require('../../constants')
const { ApiError } = require('../../util/api-error')

const createRegistrationService = ({
  transactionManager,
  userRepository,
  roleRepository,
  identityRepository,
  passwordService,
  recaptchaVerifier,
}) => ({
  async register(payload, context = {}) {
    if (!PUBLIC_REGISTRATION_ROLES.includes(payload.role)) {
      throw new ApiError(403, 'Không thể đăng ký loại tài khoản này.', 'ROLE_NOT_ALLOWED')
    }

    await recaptchaVerifier.verify({
      token: payload.recaptchaToken,
      action: 'register',
      remoteIp: context.ip,
    })

    const email = payload.email.trim().toLowerCase()
    const user = await transactionManager.transaction(async (transaction) => {
      const existingUser = await userRepository.findByEmail(email, { transaction })
      if (existingUser) {
        throw new ApiError(409, 'Email này đã được sử dụng.', 'EMAIL_ALREADY_EXISTS', {
          email: 'Email này đã được sử dụng.',
        })
      }

      const role = await roleRepository.findByCode(payload.role, { transaction })
      if (!role) {
        throw new ApiError(503, 'Dữ liệu phân quyền chưa sẵn sàng.', 'ROLE_NOT_CONFIGURED')
      }

      const passwordHash = await passwordService.hash(payload.password)
      const createdUser = await userRepository.create(
        {
          email,
          fullName: payload.fullName.trim(),
          passwordHash,
          status: 'PENDING_VERIFICATION',
        },
        { transaction },
      )

      await userRepository.assignRole(createdUser.id, role.id, { transaction })
      await identityRepository.create(
        {
          userId: createdUser.id,
          provider: 'LOCAL',
          providerSubject: email,
          emailSnapshot: email,
        },
        { transaction },
      )

      return createdUser
    })

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: payload.role,
      status: user.status,
    }
  },
})

module.exports = { createRegistrationService }
