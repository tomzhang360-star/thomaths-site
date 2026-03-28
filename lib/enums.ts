// Enum constants for SQLite (which stores as strings)
export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  HR: "HR",
  SALES: "SALES",
  TEACHER: "TEACHER",
  ACADEMIC_ADMIN: "ACADEMIC_ADMIN",
  PRINCIPAL: "PRINCIPAL",
  FINANCE: "FINANCE",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const LeadSource = {
  OUTREACH: "OUTREACH",
  REFERRAL: "REFERRAL",
  AD: "AD",
  OTHER: "OTHER",
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const ContactMethod = {
  PHONE: "PHONE",
  WECHAT: "WECHAT",
} as const;
export type ContactMethod = (typeof ContactMethod)[keyof typeof ContactMethod];

export const PackageStatus = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACTIVE: "ACTIVE",
  FINANCE_LOCK: "FINANCE_LOCK",
} as const;
export type PackageStatus = (typeof PackageStatus)[keyof typeof PackageStatus];

export const LessonType = {
  ONE_ON_ONE: "ONE_ON_ONE",
  GROUP: "GROUP",
} as const;
export type LessonType = (typeof LessonType)[keyof typeof LessonType];
