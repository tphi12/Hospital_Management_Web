import { useMemo } from 'react';
import { ScheduleStatus, RoleScope, RoleCode } from '../constants';

/**
 * useSchedulePermission(user, schedule)
 *
 * Pure, synchronous permission decisions for schedule operations.
 * Mirrors backend SchedulePermissionService exactly — same four-factor
 * formula: ROLE × SCOPE × STATUS × department/ownership.
 *
 * No extra HTTP calls are made. The hook relies on `user.roles[]` already
 * being loaded by the auth middleware and stored in AuthContext.
 *
 * ─── FE user shape (from AuthContext normalizeUser) ──────────────────
 *   {
 *     id:           number,          // user_id
 *     departmentId: number,          // department_id  ← camelCase on FE
 *     roles: Array<{
 *       role_code:     string,       // e.g. 'CLERK', 'MANAGER', 'ADMIN'
 *       scope_type:    'department' | 'hospital',
 *       department_id: number,       // snake_case — raw from API
 *     }>,
 *   }
 *
 * ─── Schedule shape (from API / types.ts) ────────────────────────────
 *   {
 *     status:                'draft' | 'submitted' | 'approved',
 *     source_department_id:  number,
 *     owner_department_id:   number,
 *   }
 *
 * @param {object|null} user      – Normalized user from AuthContext
 * @param {object|null} schedule  – Schedule object from API
 *
 * @returns {{
 *   canView:    boolean,
 *   canEdit:    boolean,
 *   canSubmit:  boolean,
 *   canApprove: boolean,
 * }}
 */
export function useSchedulePermission(user, schedule) {
  return useMemo(() => {
    // Null-safe defaults — everything is denied when either is missing
    if (!user || !schedule) {
      return { canView: false, canEdit: false, canSubmit: false, canApprove: false };
    }

    // ─── Private helpers (scoped to this memo invocation) ──────────────

    /**
     * True when the user holds a role that satisfies ALL three:
     *   role_code  === roleCode
     *   scope_type === scopeType
     *   department_id === departmentId   (ignored for hospital scope)
     *
     * Mirrors: SchedulePermissionService._hasRole()
     */
    function hasRole(roleCode, scopeType, departmentId = null) {
      const roles = user.roles ?? [];
      return roles.some((r) => {
        const matchCode  = r.role_code  === roleCode;
        const matchScope = r.scope_type === scopeType;
        const matchDept  = scopeType === RoleScope.HOSPITAL
          ? true
          : r.department_id === departmentId;
        return matchCode && matchScope && matchDept;
      });
    }

    /**
     * True when the user holds ANY hospital-scoped role.
     * Hospital scope grants cross-department read access (e.g. ADMIN).
     *
     * Mirrors: SchedulePermissionService._hasAnyHospitalRole()
     */
    function hasAnyHospitalRole() {
      const roles = user.roles ?? [];
      return roles.some((r) => r.scope_type === RoleScope.HOSPITAL);
    }

    const { status, source_department_id, owner_department_id } = schedule;
    // FE user stores the department as camelCase
    const userDeptId = user.departmentId;

    // ─── canView ───────────────────────────────────────────────────────
    //
    // Mirrors: SchedulePermissionService.canView()
    //
    // Any ONE of the following grants visibility:
    //   A. STATUS = approved   → public to all authenticated users
    //   B. Any hospital-scope role → cross-department oversight
    //   C. user.departmentId ∈ { source_department_id, owner_department_id }
    const canView = (() => {
      if (status === ScheduleStatus.APPROVED)  return true;   // A
      if (hasAnyHospitalRole())               return true;   // B
      return (                                                // C
        userDeptId === source_department_id ||
        userDeptId === owner_department_id
      );
    })();

    // ─── canEdit ───────────────────────────────────────────────────────
    //
    // Mirrors: SchedulePermissionService.canEdit()
    //
    // DRAFT      → CLERK  scoped to source dept  AND  user in source dept
    // SUBMITTED
    //  | APPROVED → MANAGER scoped to owner dept  AND  user in owner dept
    const canEdit = (() => {
      if (status === ScheduleStatus.DRAFT) {
        return (
          userDeptId === source_department_id &&
          hasRole(RoleCode.CLERK, RoleScope.DEPARTMENT, source_department_id)
        );
      }
      if (
        status === ScheduleStatus.SUBMITTED ||
        status === ScheduleStatus.APPROVED
      ) {
        return (
          userDeptId === owner_department_id &&
          hasRole(RoleCode.MANAGER, RoleScope.DEPARTMENT, owner_department_id)
        );
      }
      return false;
    })();

    // ─── canSubmit ─────────────────────────────────────────────────────
    //
    // Mirrors: SchedulePermissionService.canSubmit()
    //
    // All must hold simultaneously:
    //   STATUS = draft
    //   ROLE = CLERK  scoped to source dept
    //   user.departmentId = source dept
    const canSubmit = (() => {
      if (status !== ScheduleStatus.DRAFT) return false;
      return (
        userDeptId === source_department_id &&
        hasRole(RoleCode.CLERK, RoleScope.DEPARTMENT, source_department_id)
      );
    })();

    // ─── canApprove ────────────────────────────────────────────────────
    //
    // Mirrors: SchedulePermissionService.canApprove()
    //
    // All must hold simultaneously:
    //   STATUS = submitted
    //   ROLE = MANAGER  scoped to owner dept
    //   user.departmentId = owner dept
    const canApprove = (() => {
      if (status !== ScheduleStatus.SUBMITTED) return false;
      return (
        userDeptId === owner_department_id &&
        hasRole(RoleCode.MANAGER, RoleScope.DEPARTMENT, owner_department_id)
      );
    })();

    return { canView, canEdit, canSubmit, canApprove };
  }, [user, schedule]);
}

export default useSchedulePermission;
