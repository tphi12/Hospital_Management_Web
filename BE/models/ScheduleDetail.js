const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScheduleDetail = sequelize.define('ScheduleDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  scheduleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Schedules',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  shift: {
    type: DataTypes.ENUM('SANG', 'CHIEU', 'TOI', 'DEM'),
    allowNull: false
  },
  notes: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = ScheduleDetail;
