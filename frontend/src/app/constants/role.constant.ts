export const ROLE = {
  CANDIDATE: 1,
  EMPLOYER: 2,
  ADMIN: 3,
} as const

export type Role = (typeof ROLE)[keyof typeof ROLE]
