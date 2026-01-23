const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  weekStart: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  weekEnd: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Departments',
      key: 'id'
    }
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'SUBMITTED', 'APPROVED'),
    defaultValue: 'DRAFT'
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Schedule;
