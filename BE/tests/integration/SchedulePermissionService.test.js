/**
 * Integration tests for SchedulePermissionService
 *
 * These tests exercise the full four-factor permission formula
 * (ROLE × SCOPE × STATUS × department/ownership) using real objects.
 * No mocks — the service is pure, synchronous, and deterministic.
 *
 * Department layout used across all tests:
 *   SOURCE_DEPT  = 3   (e.g. Emergency Ward — the originating department)
 *   OWNER_DEPT   = 2   (KHTH — the approving department)
 *   OTHER_DEPT   = 5   (unrelated department)
 */

const SchedulePermissionService = require('../../src/services/SchedulePermissionService');

// ─────────────────────────────────────────────────────────────────────────────
// Fixture helpers
// ─────────────────────────────────────────────────────────────────────────────

const SOURCE_DEPT = 3;
const OWNER_DEPT  = 2;
const OTHER_DEPT  = 5;

/** Build a role record matching the shape returned by Role.getUserRoles */
function makeRole(roleCode, departmentId, scopeType = 'department') {
  return { role_code: roleCode, scope_type: scopeType, department_id: departmentId };
}

/** Build a req.user object (the shape produced by auth middleware) */
function makeUser(id, departmentId, roles = []) {
  return { userId: id, department_id: departmentId, roles };
}

/** Build a schedule object */
function makeSchedule(status) {
  return {
    schedule_id: 100,
    status,
    source_department_id: SOURCE_DEPT,
    owner_department_id: OWNER_DEPT
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// User catalogue
// Covers every distinct (role, scope, department) combination needed
// ─────────────────────────────────────────────────────────────────────────────

const users = {
  // CLERK scoped to the source department (the "normal" case for submit/edit draft)
  clerkInSource: makeUser(10, SOURCE_DEPT, [makeRole('CLERK', SOURCE_DEPT)]),

  // CLERK living in source dept but with role scoped to a DIFFERENT dept (scope mismatch)
  clerkScopeMismatch: makeUser(11, SOURCE_DEPT, [makeRole('CLERK', OTHER_DEPT)]),

  // CLERK who belongs to KHTH (owner dept) — wrong dept for draft ops
  clerkInOwner: makeUser(12, OWNER_DEPT, [makeRole('CLERK', OWNER_DEPT)]),

  // CLERK in a completely unrelated department
  clerkInOther: makeUser(13, OTHER_DEPT, [makeRole('CLERK', OTHER_DEPT)]),

  // MANAGER scoped to the owner department (KHTH) — the "normal" case for approve
  managerInOwner: makeUser(20, OWNER_DEPT, [makeRole('MANAGER', OWNER_DEPT)]),

  // MANAGER in source dept — correct role, wrong department for approve
  managerInSource: makeUser(21, SOURCE_DEPT, [makeRole('MANAGER', SOURCE_DEPT)]),

  // MANAGER in an unrelated department
  managerInOther: makeUser(22, OTHER_DEPT, [makeRole('MANAGER', OTHER_DEPT)]),

  // Hospital-scoped ADMIN (no specific department)
  adminHospital: makeUser(30, 1, [makeRole('ADMIN', null, 'hospital')]),

  // Plain staff in source dept — no role assignment
  staffInSource: makeUser(40, SOURCE_DEPT, []),

  // Plain staff in owner dept — no role assignment
  staffInOwner: makeUser(41, OWNER_DEPT, []),

  // STAFF role in owner dept — valid KHTH operator
  staffRoleInOwner: makeUser(43, OWNER_DEPT, [makeRole('STAFF', OWNER_DEPT)]),

  // Plain staff in an unrelated dept — no role assignment
  staffInOther: makeUser(42, OTHER_DEPT, [])
};

// ─────────────────────────────────────────────────────────────────────────────
// Schedule catalogue
// ─────────────────────────────────────────────────────────────────────────────

const schedules = {
  draft:     makeSchedule('draft'),
  submitted: makeSchedule('submitted'),
  approved:  makeSchedule('approved')
};

// ─────────────────────────────────────────────────────────────────────────────
// canView
// Formula: approved → public | hospital-role → all | source/owner dept → all
// ─────────────────────────────────────────────────────────────────────────────

describe('SchedulePermissionService.canView', () => {
  describe('STATUS = approved → public visibility', () => {
    it('staff in source dept CAN view approved schedule', () => {
      expect(SchedulePermissionService.canView(users.staffInSource, schedules.approved)).toBe(true);
    });

    it('staff in owner dept CAN view approved schedule', () => {
      expect(SchedulePermissionService.canView(users.staffInOwner, schedules.approved)).toBe(true);
    });

    it('staff in an unrelated dept CAN view approved schedule (public)', () => {
      expect(SchedulePermissionService.canView(users.staffInOther, schedules.approved)).toBe(true);
    });
  });

  describe('STATUS = draft|submitted → restricted to involved departments or hospital role', () => {
    it('CLERK in source dept CAN view own department\'s draft', () => {
      expect(SchedulePermissionService.canView(users.clerkInSource, schedules.draft)).toBe(true);
    });

    it('MANAGER in owner dept (KHTH) CAN view draft schedule', () => {
      expect(SchedulePermissionService.canView(users.managerInOwner, schedules.draft)).toBe(true);
    });

    it('plain staff in source dept CAN view draft (department membership sufficient)', () => {
      expect(SchedulePermissionService.canView(users.staffInSource, schedules.draft)).toBe(true);
    });

    it('CLERK in source dept CAN view submitted schedule', () => {
      expect(SchedulePermissionService.canView(users.clerkInSource, schedules.submitted)).toBe(true);
    });

    it('MANAGER in owner dept CAN view submitted schedule', () => {
      expect(SchedulePermissionService.canView(users.managerInOwner, schedules.submitted)).toBe(true);
    });

    it('staff in unrelated dept CANNOT view draft (not involved)', () => {
      expect(SchedulePermissionService.canView(users.staffInOther, schedules.draft)).toBe(false);
    });

    it('CLERK in unrelated dept CANNOT view draft even with CLERK role', () => {
      expect(SchedulePermissionService.canView(users.clerkInOther, schedules.draft)).toBe(false);
    });
  });

  describe('Hospital-scope role overrides department restriction', () => {
    it('hospital ADMIN CAN view any draft schedule', () => {
      expect(SchedulePermissionService.canView(users.adminHospital, schedules.draft)).toBe(true);
    });

    it('hospital ADMIN CAN view submitted schedules across departments', () => {
      expect(SchedulePermissionService.canView(users.adminHospital, schedules.submitted)).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// canEdit
// Formula:
//   draft     → CLERK + scope=dept + dept=source + user.dept=source
//   submitted | approved → MANAGER + scope=dept + dept=owner + user.dept=owner
// ─────────────────────────────────────────────────────────────────────────────

describe('SchedulePermissionService.canUpdate', () => {
  describe('STATUS = draft — only CLERK in source department', () => {
    it('CLERK in source dept CAN edit draft (all four factors match)', () => {
      expect(SchedulePermissionService.canUpdate(users.clerkInSource, schedules.draft)).toBe(true);
    });

    it('CLERK with role scoped to wrong dept CANNOT edit draft (scope mismatch)', () => {
      // user.department_id = SOURCE_DEPT but role.department_id = OTHER_DEPT
      expect(SchedulePermissionService.canUpdate(users.clerkScopeMismatch, schedules.draft)).toBe(false);
    });

    it('MANAGER in source dept CANNOT edit draft (wrong role for draft status)', () => {
      expect(SchedulePermissionService.canUpdate(users.managerInSource, schedules.draft)).toBe(false);
    });

    it('CLERK in owner dept CANNOT edit draft (wrong department)', () => {
      expect(SchedulePermissionService.canUpdate(users.clerkInOwner, schedules.draft)).toBe(false);
    });

    it('plain staff in source dept CANNOT edit draft (no role)', () => {
      expect(SchedulePermissionService.canUpdate(users.staffInSource, schedules.draft)).toBe(false);
    });
  });

  describe('STATUS = submitted — KHTH manager may adjust before publish', () => {
    it('MANAGER in owner dept CAN edit submitted schedule', () => {
      expect(SchedulePermissionService.canUpdate(users.managerInOwner, schedules.submitted)).toBe(true);
    });

    it('CLERK in source dept CANNOT edit submitted (status no longer draft)', () => {
      expect(SchedulePermissionService.canUpdate(users.clerkInSource, schedules.submitted)).toBe(false);
    });

    it('CLERK in owner dept CANNOT edit submitted (wrong role)', () => {
      expect(SchedulePermissionService.canUpdate(users.clerkInOwner, schedules.submitted)).toBe(false);
    });

    it('MANAGER in source dept CANNOT edit submitted (wrong department)', () => {
      expect(SchedulePermissionService.canUpdate(users.managerInSource, schedules.submitted)).toBe(false);
    });

    it('MANAGER in unrelated dept CANNOT edit submitted (not owner)', () => {
      expect(SchedulePermissionService.canUpdate(users.managerInOther, schedules.submitted)).toBe(false);
    });
  });

  describe('STATUS = approved — owner MANAGER retains edit access', () => {
    it('MANAGER in owner dept CAN edit approved schedule (KHTH may correct post-approval)', () => {
      expect(SchedulePermissionService.canUpdate(users.managerInOwner, schedules.approved)).toBe(true);
    });

    it('CLERK in source dept CANNOT edit approved schedule', () => {
      expect(SchedulePermissionService.canUpdate(users.clerkInSource, schedules.approved)).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// canSubmit
// Formula: STATUS=draft AND CLERK + scope=dept + dept=source + user.dept=source
// ─────────────────────────────────────────────────────────────────────────────

describe('SchedulePermissionService.canSubmit', () => {
  describe('STATUS = draft — source dept CLERK only', () => {
    it('CLERK in source dept CAN submit draft (all four factors match)', () => {
      expect(SchedulePermissionService.canSubmit(users.clerkInSource, schedules.draft)).toBe(true);
    });

    it('CLERK with scope mismatch CANNOT submit (role not scoped to source dept)', () => {
      expect(SchedulePermissionService.canSubmit(users.clerkScopeMismatch, schedules.draft)).toBe(false);
    });

    it('MANAGER in source dept CANNOT submit (MANAGER is not the submitting role)', () => {
      expect(SchedulePermissionService.canSubmit(users.managerInSource, schedules.draft)).toBe(false);
    });

    it('CLERK in owner dept CANNOT submit source dept schedule (wrong department)', () => {
      expect(SchedulePermissionService.canSubmit(users.clerkInOwner, schedules.draft)).toBe(false);
    });

    it('CLERK in unrelated dept CANNOT submit (not involved)', () => {
      expect(SchedulePermissionService.canSubmit(users.clerkInOther, schedules.draft)).toBe(false);
    });

    it('plain staff in source dept CANNOT submit (no CLERK role)', () => {
      expect(SchedulePermissionService.canSubmit(users.staffInSource, schedules.draft)).toBe(false);
    });
  });

  describe('STATUS ≠ draft — submission is never allowed', () => {
    it('CLERK in source dept CANNOT resubmit an already-submitted schedule', () => {
      expect(SchedulePermissionService.canSubmit(users.clerkInSource, schedules.submitted)).toBe(false);
    });

    it('CLERK in source dept CANNOT submit an approved schedule', () => {
      expect(SchedulePermissionService.canSubmit(users.clerkInSource, schedules.approved)).toBe(false);
    });

    it('MANAGER in owner dept CANNOT submit regardless of status', () => {
      expect(SchedulePermissionService.canSubmit(users.managerInOwner, schedules.submitted)).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// canApprove
// Formula: STATUS=submitted AND MANAGER + scope=dept + dept=owner + user.dept=owner
// ─────────────────────────────────────────────────────────────────────────────

describe('SchedulePermissionService.canApprove', () => {
  describe('STATUS = submitted — owner dept MANAGER only', () => {
    it('MANAGER in owner dept CAN approve submitted schedule (all four factors match)', () => {
      expect(SchedulePermissionService.canApprove(users.managerInOwner, schedules.submitted)).toBe(true);
    });

    it('CLERK in owner dept CANNOT approve (wrong role)', () => {
      expect(SchedulePermissionService.canApprove(users.clerkInOwner, schedules.submitted)).toBe(false);
    });

    it('MANAGER in source dept CANNOT approve (not the owner department)', () => {
      expect(SchedulePermissionService.canApprove(users.managerInSource, schedules.submitted)).toBe(false);
    });

    it('MANAGER in unrelated dept CANNOT approve (not the owner department)', () => {
      expect(SchedulePermissionService.canApprove(users.managerInOther, schedules.submitted)).toBe(false);
    });

    it('hospital ADMIN CAN approve as an override', () => {
      expect(SchedulePermissionService.canApprove(users.adminHospital, schedules.submitted)).toBe(true);
    });

    it('STAFF in owner dept CAN approve submitted schedule (KHTH staff acts like operator)', () => {
      expect(SchedulePermissionService.canApprove(users.staffRoleInOwner, schedules.submitted)).toBe(true);
    });

    it('plain staff in owner dept CANNOT approve without a scoped STAFF or MANAGER role', () => {
      expect(SchedulePermissionService.canApprove(users.staffInOwner, schedules.submitted)).toBe(false);
    });
  });

  describe('STATUS ≠ submitted — approval is never allowed', () => {
    it('MANAGER in owner dept CANNOT approve a draft (must be submitted first)', () => {
      expect(SchedulePermissionService.canApprove(users.managerInOwner, schedules.draft)).toBe(false);
    });

    it('MANAGER in owner dept CANNOT re-approve an already-approved schedule', () => {
      expect(SchedulePermissionService.canApprove(users.managerInOwner, schedules.approved)).toBe(false);
    });
  });
});

describe('SchedulePermissionService.canApprove for weekly work draft', () => {
  const weeklyDraft = {
    ...schedules.draft,
    schedule_type: 'weekly_work',
  };

  it('MANAGER in owner dept CAN publish a weekly work draft', () => {
    expect(SchedulePermissionService.canApprove(users.managerInOwner, weeklyDraft)).toBe(true);
  });

  it('STAFF in owner dept CAN publish a weekly work draft', () => {
    expect(SchedulePermissionService.canApprove(users.staffRoleInOwner, weeklyDraft)).toBe(true);
  });

  it('staff without scoped KHTH role CANNOT publish a weekly work draft', () => {
    expect(SchedulePermissionService.canApprove(users.staffInOwner, weeklyDraft)).toBe(false);
  });
});
