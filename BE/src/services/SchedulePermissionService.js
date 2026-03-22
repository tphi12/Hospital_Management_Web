const { ScheduleStatus, RoleScope } = require('../utils/enums');

class SchedulePermissionService {
  static _hasRole(user, roleCode, scopeType, departmentId = null) {
    const roles = user.roles || [];
    return roles.some((role) => {
      const matchesCode = role.role_code === roleCode;
      const matchesScope = role.scope_type === scopeType;
      const matchesDepartment = scopeType === RoleScope.HOSPITAL
        ? true
        : role.department_id === departmentId;

      return matchesCode && matchesScope && matchesDepartment;
    });
  }

  static _hasAnyHospitalRole(user) {
    const roles = user.roles || [];
    return roles.some((role) => role.scope_type === RoleScope.HOSPITAL);
  }

  static _isSourceDepartmentMember(user, schedule) {
    return user.department_id === schedule.source_department_id;
  }

  static _isOwnerDepartmentMember(user, schedule) {
    return user.department_id === schedule.owner_department_id;
  }

  static _isAdmin(user) {
    return this._hasRole(user, 'ADMIN', RoleScope.HOSPITAL);
  }

  static _isKHTHOperator(user, schedule) {
    if (this._isAdmin(user)) {
      return true;
    }

    if (!this._isOwnerDepartmentMember(user, schedule)) {
      return false;
    }

    return (
      this._hasRole(user, 'STAFF', RoleScope.DEPARTMENT, schedule.owner_department_id) ||
      this._hasRole(user, 'MANAGER', RoleScope.DEPARTMENT, schedule.owner_department_id)
    );
  }

  static canView(user, schedule) {
    if (schedule.status === ScheduleStatus.APPROVED) {
      return true;
    }

    if (this._hasAnyHospitalRole(user)) {
      return true;
    }

    return this._isSourceDepartmentMember(user, schedule) || this._isOwnerDepartmentMember(user, schedule);
  }

  static canUpdate(user, schedule) {
    if (schedule.schedule_type === 'weekly_work') {
      return this._isKHTHOperator(user, schedule);
    }

    if (schedule.status === ScheduleStatus.DRAFT) {
      return (
        this._isSourceDepartmentMember(user, schedule) &&
        this._hasRole(user, 'CLERK', RoleScope.DEPARTMENT, schedule.source_department_id)
      );
    }

    if (schedule.status === ScheduleStatus.SUBMITTED || schedule.status === ScheduleStatus.APPROVED) {
      return this._isKHTHOperator(user, schedule);
    }

    return false;
  }

  static canEdit(user, schedule) {
    return this.canUpdate(user, schedule);
  }

  static canSubmit(user, schedule) {
    if (schedule.status !== ScheduleStatus.DRAFT) {
      return false;
    }

    return (
      this._isSourceDepartmentMember(user, schedule) &&
      this._hasRole(user, 'CLERK', RoleScope.DEPARTMENT, schedule.source_department_id)
    );
  }

  static canApprove(user, schedule) {
    if (schedule.status === ScheduleStatus.SUBMITTED) {
      return this._isKHTHOperator(user, schedule);
    }

    if (schedule.schedule_type === 'weekly_work' && schedule.status === ScheduleStatus.DRAFT) {
      return this._isKHTHOperator(user, schedule);
    }

    return false;
  }

  static canDelete(user, schedule) {
    if (this._hasAnyHospitalRole(user)) {
      return true;
    }

    if (schedule.schedule_type === 'weekly_work') {
      return this._isKHTHOperator(user, schedule);
    }

    if (schedule.status === ScheduleStatus.DRAFT) {
      return (
        this._isSourceDepartmentMember(user, schedule) &&
        this._hasRole(user, 'CLERK', RoleScope.DEPARTMENT, schedule.source_department_id)
      );
    }

    if (schedule.status === ScheduleStatus.APPROVED) {
      return this._isKHTHOperator(user, schedule);
    }

    return false;
  }

  static canManageWeeklyWork(user, schedule) {
    return this._isKHTHOperator(user, schedule);
  }

  static canExport(user, schedule) {
    return this.canView(user, schedule);
  }
}

module.exports = SchedulePermissionService;
