export const ROLE = {
  CANDIDATE: 'CANDIDATE',
  EMPLOYER: 'EMPLOYER',
  ADMIN: 'ADMIN',
} as const

export type Role = (typeof ROLE)[keyof typeof ROLE]
