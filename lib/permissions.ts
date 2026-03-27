import { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  name: string;
  phone?: string;
  roles: Role[];
  campusIds: string[];
};

export function hasRole(user: SessionUser | null | undefined, ...roles: Role[]): boolean {
  if (!user) return false;
  return roles.some((r) => user.roles.includes(r));
}

export function isSuperAdmin(user: SessionUser | null | undefined): boolean {
  return hasRole(user, Role.SUPER_ADMIN);
}

export function hasCampusAccess(user: SessionUser | null | undefined, campusId: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return user.campusIds.includes(campusId);
}

export function canManageUsers(user: SessionUser | null | undefined): boolean {
  return hasRole(user, Role.SUPER_ADMIN, Role.HR);
}

export function canConfirmPackage(user: SessionUser | null | undefined): boolean {
  return hasRole(user, Role.PRINCIPAL, Role.SUPER_ADMIN);
}

export function canEditActivePackage(user: SessionUser | null | undefined): boolean {
  return hasRole(user, Role.FINANCE, Role.SUPER_ADMIN);
}

export function canCreatePackage(user: SessionUser | null | undefined): boolean {
  return hasRole(user, Role.SALES, Role.PRINCIPAL, Role.SUPER_ADMIN);
}

export function canSubmitLog(user: SessionUser | null | undefined): boolean {
  return hasRole(user, Role.TEACHER, Role.SUPER_ADMIN);
}

export function canConfirmLog(user: SessionUser | null | undefined): boolean {
  return hasRole(user, Role.ACADEMIC_ADMIN, Role.PRINCIPAL, Role.SUPER_ADMIN);
}

export function canReverseDeduction(user: SessionUser | null | undefined): boolean {
  return hasRole(user, Role.FINANCE, Role.SUPER_ADMIN);
}

export function canSchedule(user: SessionUser | null | undefined): boolean {
  return hasRole(user, Role.TEACHER, Role.ACADEMIC_ADMIN, Role.PRINCIPAL, Role.SUPER_ADMIN);
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "超级管理员",
  HR: "HR",
  SALES: "销售",
  TEACHER: "老师",
  ACADEMIC_ADMIN: "教务",
  PRINCIPAL: "校长",
  FINANCE: "财务",
};
