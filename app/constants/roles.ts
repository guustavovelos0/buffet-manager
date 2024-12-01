export const ROLES = {
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES]; 