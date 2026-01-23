const User = require('./User');
const Department = require('./Department');
const Document = require('./Document');
const Schedule = require('./Schedule');
const ScheduleDetail = require('./ScheduleDetail');

// User - Department relationships
Department.hasMany(User, { foreignKey: 'departmentId', as: 'members' });
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

// Department manager relationship
Department.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

// Document relationships
Department.hasMany(Document, { foreignKey: 'departmentId', as: 'documents' });
Document.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

User.hasMany(Document, { foreignKey: 'uploadedBy', as: 'uploadedDocuments' });
Document.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

Document.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Schedule relationships
Department.hasMany(Schedule, { foreignKey: 'departmentId', as: 'schedules' });
Schedule.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

User.hasMany(Schedule, { foreignKey: 'createdBy', as: 'createdSchedules' });
Schedule.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Schedule.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Schedule Detail relationships
Schedule.hasMany(ScheduleDetail, { foreignKey: 'scheduleId', as: 'details' });
ScheduleDetail.belongsTo(Schedule, { foreignKey: 'scheduleId', as: 'schedule' });

User.hasMany(ScheduleDetail, { foreignKey: 'userId', as: 'scheduleDetails' });
ScheduleDetail.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  Department,
  Document,
  Schedule,
  ScheduleDetail
};
