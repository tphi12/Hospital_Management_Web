/**
 * User Roles in the Hospital System
 */
export const ROLES = {
  ADMIN: "ADMIN",
  HOSPITAL_CLERK: "HOSPITAL_CLERK",   // Văn Thư
  HEAD_OF_DEPT: "HEAD_OF_DEPT",       // Trưởng Phòng
  DEPT_CLERK: "DEPT_CLERK",           // Văn Thư Phòng Ban
  STAFF: "STAFF",                     // Nhân Viên
  KHTH: "KHTH",                       // STAFF thuộc phòng KHTH 
};

/**
 * Role Metadata (for UI Display)
 */
export const ROLE_DETAILS = {
  [ROLES.ADMIN]: {
    label: "Quản trị viên",
    description: "Quản lý toàn bộ hệ thống, người dùng, và cấu hình.",
    color: "bg-purple-100 text-purple-700",
  },
  [ROLES.HOSPITAL_CLERK]: {
    label: "Văn thư Bệnh viện",
    description: "Quản lý văn bản đi/đến, lưu trữ hồ sơ chung của bệnh viện.",
    color: "bg-blue-100 text-blue-700",
  },
  [ROLES.HEAD_OF_DEPT]: {
    label: "Trưởng phòng",
    description: "Quản lý nhân sự phòng ban, phê duyệt tài liệu, xem lịch trực.",
    color: "bg-red-100 text-red-700",
  },
  [ROLES.DEPT_CLERK]: {
    label: "Văn thư Phòng ban",
    description: "Soạn thảo văn bản, đăng tải tài liệu, đề xuất lịch trực.",
    color: "bg-orange-100 text-orange-700",
  },
  [ROLES.STAFF]: {
    label: "Nhân viên",
    description: "Xem lịch trực, xem tài liệu, nhận thông báo.",
    color: "bg-green-100 text-green-700",
  },
  [ROLES.KHTH]: {
    label: "KHTH",
    description: "Người dùng STAFF thuộc phòng KHTH, có quyền nghiệp vụ KHTH.",
    color: "bg-cyan-100 text-cyan-700",
  },
};

/**
 * Permissions mapping
 */
export const PERMISSIONS = {
  MANAGE_USERS: {
    id: "MANAGE_USERS",
    label: "Quản lý người dùng",
    roles: [ROLES.ADMIN]
  },
  MANAGE_DEPARTMENTS: {
    id: "MANAGE_DEPARTMENTS",
    label: "Quản lý phòng ban",
    roles: [ROLES.ADMIN]
  },
  MANAGE_DOCUMENTS: {
    id: "MANAGE_DOCUMENTS",
    label: "Quản lý kho văn bản",
    roles: [ROLES.HOSPITAL_CLERK, ROLES.ADMIN]
  },
  APPROVE_DOCUMENTS: {
    id: "APPROVE_DOCUMENTS",
    label: "Phê duyệt văn bản",
    roles: [ROLES.HEAD_OF_DEPT]
  },
  UPLOAD_DOCUMENTS: {
    id: "UPLOAD_DOCUMENTS",
    label: "Đăng tải văn bản",
    roles: [ROLES.STAFF, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.ADMIN]
  },
  CREATE_SCHEDULE_DRAFT: {
    id: "CREATE_SCHEDULE_DRAFT",
    label: "Tạo dự thảo lịch trực",
    roles: [ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT]
  },
  PUBLISH_MASTER_SCHEDULE: {
    id: "PUBLISH_MASTER_SCHEDULE",
    label: "Ban hành lịch trực bộ phận",
    roles: [ROLES.KHTH, ROLES.ADMIN]
  },
  VIEW_SCHEDULE: {
    id: "VIEW_SCHEDULE",
    label: "Xem lịch trực",
    roles: [ROLES.STAFF, ROLES.DEPT_CLERK, ROLES.HEAD_OF_DEPT, ROLES.HOSPITAL_CLERK, ROLES.KHTH, ROLES.ADMIN]
  },
};
