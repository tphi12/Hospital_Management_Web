const { ScheduleStatus, RoleScope } = require('../utils/enums');

/**
 * SchedulePermissionService
 *
 * Centralised, declarative permission checks for schedule operations.
 *
 * Every method evaluates the full four-factor formula:
 *   ROLE  × SCOPE  × STATUS  × department/ownership
 *
 * No single factor is sufficient on its own — all must align.
 *
 * The `user` argument is `req.user` produced by the auth middleware.
 * It already contains the pre-loaded `roles` array (populated via
 * Role.getUserRoles), so these methods are synchronous and make no
 * additional database calls.
 *
 * Shape of `user`:
 *   { userId: number, department_id: number, roles: RoleRecord[] }
 *
 * Shape of `schedule`:
 *   { status: string, source_department_id: number, owner_department_id: number }
 *
 * Shape of each element in `user.roles` (from USER_ROLE JOIN ROLE):
 *   { role_code: string, scope_type: 'department'|'hospital', department_id: number }
 */
class SchedulePermissionService {
  // ─────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Return true when the user holds a specific role that satisfies ALL of:
   *   • role_code  matches `roleCode`
   *   • scope_type matches `scopeType`
   *   • department_id matches `departmentId`  (irrelevant for hospital scope)
   *
   * @param {Object}      user         - req.user (must contain .roles[])
   * @param {string}      roleCode     - e.g. 'CLERK', 'MANAGER'
   * @param {string}      scopeType    - RoleScope.DEPARTMENT | RoleScope.HOSPITAL
   * @param {number|null} departmentId - required when scopeType = 'department'
   * @returns {boolean}
   */
  static _hasRole(user, roleCode, scopeType, departmentId = null) {
    const roles = user.roles || [];
    return roles.some(role => {
      const matchesCode  = role.role_code  === roleCode;
      const matchesScope = role.scope_type === scopeType;
      const matchesDept  = scopeType === RoleScope.HOSPITAL
        ? true
        : role.department_id === departmentId;
      return matchesCode && matchesScope && matchesDept;
    });
  }

  /**
   * Return true when the user holds ANY hospital-scoped role (e.g. ADMIN).
   * Hospital-scoped roles implicitly grant cross-department read access.
   *
   * @param {Object} user - req.user
   * @returns {boolean}
   */
  static _hasAnyHospitalRole(user) {
    const roles = user.roles || [];
    return roles.some(r => r.scope_type === RoleScope.HOSPITAL);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public permission methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * canView — may the user see this schedule?
   *
   * Formula (any one condition grants access):
   *   A. STATUS = approved             → public visibility
   *   B. user has a hospital-scope role → see everything
   *   C. user.department_id ∈ { source_department_id, owner_department_id }
   *
   * Rationale:
   *   - Approved schedules must be visible to all staff for operational
   *     planning.
   *   - Hospital-scope roles (ADMIN, etc.) need cross-department oversight.
   *   - Source and owner departments collaborate on a schedule from creation
   *     through approval, so both need full read access at every status.
   *
   * @param {{ userId: number, department_id: number, roles: Array }} user
   * @param {{ status: string, source_department_id: number, owner_department_id: number }} schedule
   * @returns {boolean}
   */
  static canView(user, schedule) {
    // A — Approved schedules are publicly visible to all staff
    if (schedule.status === ScheduleStatus.APPROVED) {
      return true;
    }

    // B — Hospital-scope role: admin/oversight can see any status
    if (this._hasAnyHospitalRole(user)) {
      return true;
    }

    // C — Members of either department involved in this schedule
    const inSourceDept = user.department_id === schedule.source_department_id;
    const inOwnerDept  = user.department_id === schedule.owner_department_id;
    return inSourceDept || inOwnerDept;
  }

  /**
   * canEdit — may the user modify schedule fields?
   *
   * Formula (all conditions in the active branch must hold):
   *   STATUS = draft     → CLERK scoped to source_department_id
   *                        AND user.department_id = source_department_id
   *   STATUS = submitted
   *         | approved   → MANAGER scoped to owner_department_id
   *                        AND user.department_id = owner_department_id
   *
   * Rationale:
   *   - Draft ownership belongs to the source (originating) department's
   *     CLERK who is responsible for the initial schedule.
   *   - Once submitted, the KHTH (owner) takes editorial control for review
   *     and correction without requiring a re-submission.
   *
   * @param {{ userId: number, department_id: number, roles: Array }} user
   * @param {{ status: string, source_department_id: number, owner_department_id: number }} schedule
   * @returns {boolean}
   */
  static canEdit(user, schedule) {
    const { status, source_department_id, owner_department_id } = schedule;

    if (status === ScheduleStatus.DRAFT) {
      // ROLE=CLERK  +  SCOPE=department  +  dept=source  +  user.dept=source
      return (
        user.department_id === source_department_id &&
        this._hasRole(user, 'CLERK', RoleScope.DEPARTMENT, source_department_id)
      );
    }

    if (status === ScheduleStatus.SUBMITTED || status === ScheduleStatus.APPROVED) {
      // ROLE=MANAGER  +  SCOPE=department  +  dept=owner  +  user.dept=owner
      return (
        user.department_id === owner_department_id &&
        this._hasRole(user, 'MANAGER', RoleScope.DEPARTMENT, owner_department_id)
      );
    }

    return false;
  }

  /**
   * canSubmit — may the user submit this draft for approval?
   *
   * Formula (all must hold simultaneously):
   *   STATUS = draft
   *   AND ROLE = CLERK  scoped to source_department_id
   *   AND user.department_id = source_department_id
   *
   * Rationale:
   *   Submission is an act of the source department declaring the draft
   *   complete; the KHTH (owner) must not self-submit on their behalf.
   *
   * @param {{ userId: number, department_id: number, roles: Array }} user
   * @param {{ status: string, source_department_id: number }} schedule
   * @returns {boolean}
   */
  static canSubmit(user, schedule) {
    // STATUS gate — only drafts can be submitted
    if (schedule.status !== ScheduleStatus.DRAFT) {
      return false;
    }

    // ROLE=CLERK  +  SCOPE=department  +  dept=source  +  user.dept=source
    return (
      user.department_id === schedule.source_department_id &&
      this._hasRole(user, 'CLERK', RoleScope.DEPARTMENT, schedule.source_department_id)
    );
  }

  /**
   * canApprove — may the user approve this schedule?
   *
   * Formula (all must hold simultaneously):
   *   STATUS = submitted
   *   AND ROLE = MANAGER  scoped to owner_department_id
   *   AND user.department_id = owner_department_id
   *
   * Rationale:
   *   Approval authority belongs exclusively to the KHTH department manager.
   *   A submitted status is required so that draft schedules cannot be
   *   approved without going through the submission workflow.
   *
   * @param {{ userId: number, department_id: number, roles: Array }} user
   * @param {{ status: string, owner_department_id: number }} schedule
   * @returns {boolean}
   */
  static canApprove(user, schedule) {
    // STATUS gate — only submitted schedules can be approved
    if (schedule.status !== ScheduleStatus.SUBMITTED) {
      return false;
    }

    // ROLE=MANAGER  +  SCOPE=department  +  dept=owner  +  user.dept=owner
    return (
      user.department_id === schedule.owner_department_id &&
      this._hasRole(user, 'MANAGER', RoleScope.DEPARTMENT, schedule.owner_department_id)
    );
  }
}

module.exports = SchedulePermissionService;
