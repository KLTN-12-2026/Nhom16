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
  role: Extract<Role, 'CANDIDATE' | 'EMPLOYER'>
  recaptchaToken: string
}

export interface LoginPayload {
  email: string
  password: string
  recaptchaToken: string
}

export interface GoogleAuthPayload {
  credential: string
  role?: Extract<Role, 'CANDIDATE' | 'EMPLOYER'>
  recaptchaToken: string
}
