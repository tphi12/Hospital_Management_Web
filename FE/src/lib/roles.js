/**
 * User Roles in the Hospital System
 */
export const ROLES = {
  ADMIN: "ADMIN",
  HOSPITAL_CLERK: "HOSPITAL_CLERK",   // Văn Thư
  HEAD_OF_DEPT: "HEAD_OF_DEPT",       // Trưởng Phòng
  DEPT_CLERK: "DEPT_CLERK",           // Văn Thư Phòng Ban
  STAFF: "STAFF",                     // Nhân Viên
  KHTH: "KHTH",                       // Kế Hoạch Tổng Hợp
};

/**
 * Permissions mapping (optional, for granular control)
 */
export const PERMISSIONS = {
  MANAGE_USERS: [ROLES.ADMIN],
  MANAGE_DOCUMENTS: [ROLES.HOSPITAL_CLERK],
  APPROVE_DOCUMENTS: [ROLES.HEAD_OF_DEPT],
  CREATE_SCHEDULE_DRAFT: [ROLES.DEPT_CLERK],
  PUBLISH_MASTER_SCHEDULE: [ROLES.KHTH],
  UPLOAD_DOCUMENTS: [ROLES.STAFF, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT],
  VIEW_SCHEDULE: [ROLES.STAFF, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.HOSPITAL_CLERK, ROLES.KHTH],
};
