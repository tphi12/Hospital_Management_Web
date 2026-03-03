import { ROLES } from './roles';

type RoleEntry = {
  role_code?: string;
  scope_type?: string;
  department_id?: number | null;
  department_code?: string | null;
  department_name?: string | null;
};

type AuthUser = {
  role?: string;
  departmentId?: number | null;
  departmentCode?: string | null;
  departmentName?: string | null;
  roles?: RoleEntry[];
};

/**
 * True if user has a role by role_code in user.roles[]
 * (with backward-compatible fallback to user.role when roles[] is absent).
 */
export function hasRole(user: AuthUser | null | undefined, roleCode: string): boolean {
  if (!user || !roleCode) return false;

  const roleEntries = user.roles ?? [];
  if (roleEntries.length > 0) {
    return roleEntries.some((r) => r?.role_code === roleCode);
  }

  return user.role === roleCode;
}

/**
 * True if user has any department-scoped role for the provided department.
 */
export function hasDepartmentScope(
  user: AuthUser | null | undefined,
  departmentId: number | null | undefined,
): boolean {
  if (!user || departmentId == null) return false;

  return (user.roles ?? []).some(
    (r) => r?.scope_type === 'department' && r?.department_id === departmentId,
  );
}

/**
 * True if user has any hospital-scoped role.
 */
export function isHospitalScope(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return (user.roles ?? []).some((r) => r?.scope_type === 'hospital');
}

/**
 * Business rule: "KHTH".
 * A user is treated as KHTH when they have STAFF role and belong to KHTH department.
 */
export function isKHTHStaff(user: AuthUser | null | undefined): boolean {
  if (!user) return false;

  const hasStaffRole = hasRole(user, ROLES.STAFF);
  if (!hasStaffRole) return false;

  const userDeptCode = String(user.departmentCode ?? '').toUpperCase();
  if (userDeptCode === 'KHTH') return true;

  const inKHTHByRoleDepartment = (user.roles ?? []).some((r) => {
    const deptCode = String(r?.department_code ?? '').toUpperCase();
    const deptName = String(r?.department_name ?? '').toUpperCase();
    return deptCode === 'KHTH' || deptName.includes('KẾ HOẠCH TỔNG HỢP') || deptName.includes('KE HOACH TONG HOP');
  });

  return inKHTHByRoleDepartment;
}

/**
 * Returns all effective role codes used by FE permission checks, including
 * aliases and virtual roles derived from business rules.
 */
export function getEffectiveRoleCodes(user: AuthUser | null | undefined): Set<string> {
  const codes = new Set<string>();
  if (!user) return codes;

  (user.roles ?? []).forEach((r) => {
    if (r?.role_code) codes.add(r.role_code);
  });
  if (user.role) codes.add(user.role);

  if (codes.has('CLERK')) codes.add(ROLES.DEPT_CLERK);
  if (codes.has('MANAGER')) codes.add(ROLES.HEAD_OF_DEPT);
  if (isKHTHStaff(user)) codes.add(ROLES.KHTH);

  return codes;
}
