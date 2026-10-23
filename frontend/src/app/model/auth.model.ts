import type { Permission } from '../constants/permission.constant'
import type { Role } from '../constants/role.constant'

export interface AuthUser {
  id: number
  email: string
  fullName: string
  role: Role
  permissions: Permission[]
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'LOCKED' | 'DISABLED'
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  role: Extract<Role, 1 | 2>
  termsAccepted: boolean
  companyName?: string
  taxCode?: string
  businessLicenseNumber?: string
  companyPhone?: string
  companyAddress?: string
  companyWebsite?: string
  representativeName?: string
  representativePosition?: string
  recaptchaToken: string
}

export interface LoginPayload {
  email: string
  password: string
  recaptchaToken: string
}

export interface GoogleAuthPayload {
  credential: string
  role?: Extract<Role, 1 | 2>
  termsAccepted?: boolean
  recaptchaToken: string
}

export interface ForgotPasswordPayload { email: string }

export interface ResetPasswordPayload {
  token: string
  password: string
  confirmPassword: string
}

export interface VerifyEmailPayload { token: string }
export interface ResendVerificationPayload { email: string }
