const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.isLocked) {
      return res.status(403).json({ message: 'Tài khoản đã bị khoá, vui lòng liên hệ ADMIN' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

// Check if user has required role
exports.checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Bạn không có quyền truy cập chức năng này',
        requiredRoles: roles,
        yourRole: req.user.role
      });
    }

    next();
  };
};

// Check if user is ADMIN
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Chỉ ADMIN mới có quyền thực hiện chức năng này' });
  }
  next();
};

// Check if user can manage documents
exports.canManageDocuments = (req, res, next) => {
  const allowedRoles = ['ADMIN', 'VAN_THU', 'TRUONG_PHONG'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Bạn không có quyền quản lý tài liệu' });
  }
  next();
};

// Check if user can manage schedules
exports.canManageSchedules = (req, res, next) => {
  const allowedRoles = ['ADMIN', 'KHTH', 'VAN_THU_PHONG_BAN'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Bạn không có quyền quản lý lịch trực' });
  }
  next();
};
