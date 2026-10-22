const { PUBLIC_REGISTRATION_ROLES, ROLES } = require('../../constants')
const { ApiError } = require('../../util/api-error')

const createRegistrationService = ({
  transactionManager,
  userRepository,
  roleRepository,
  identityRepository,
  employerProfileRepository,
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

      const role = await roleRepository.findById(payload.role, { transaction })
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

      if (payload.role === ROLES.EMPLOYER) {
        const existingCompany = await employerProfileRepository.findByTaxCode(payload.taxCode, { transaction })
        if (existingCompany) {
          throw new ApiError(409, 'Mã số thuế này đã được đăng ký.', 'TAX_CODE_ALREADY_EXISTS', { taxCode: 'Mã số thuế này đã được đăng ký.' })
        }
        await employerProfileRepository.create({
          userId: createdUser.id,
          companyName: payload.companyName,
          taxCode: payload.taxCode,
          businessLicenseNumber: payload.businessLicenseNumber,
          companyPhone: payload.companyPhone,
          companyAddress: payload.companyAddress,
          companyWebsite: payload.companyWebsite,
          representativeName: payload.representativeName,
          representativePosition: payload.representativePosition,
          verificationStatus: 'PENDING_REVIEW',
        }, { transaction })
      }

      return createdUser
    })

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: payload.role,
      status: user.status,
      ...(payload.role === ROLES.EMPLOYER ? { companyVerificationStatus: 'PENDING_REVIEW' } : {}),
    }
  },
})

module.exports = { createRegistrationService }
