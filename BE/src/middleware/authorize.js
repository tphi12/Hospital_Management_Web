const Schedule = require('../models/Schedule');
const SchedulePermissionService = require('../services/SchedulePermissionService');

/**
 * Authorization middleware - Kiểm tra quyền dựa trên ROLE + SCOPE + ENTITY + STATUS + OWNERSHIP
 */

const checkRole = (...allowedRoleCodes) => {
  return (req, res, next) => {
    try {
      const userRoles = req.user.roles || [];
      
      // Check if user has any of the allowed roles
      const hasRole = userRoles.some(role => 
        allowedRoleCodes.includes(role.role_code)
      );
      
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập chức năng này'
        });
      }
      
      next();
    } catch (error) {
      console.error('Check role error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền',
        error: error.message
      });
    }
  };
};

const checkAdmin = (req, res, next) => {
  try {
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.some(role => role.role_code === 'ADMIN');
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ ADMIN mới có quyền thực hiện chức năng này'
      });
    }
    
    next();
  } catch (error) {
    console.error('Check admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra quyền admin',
      error: error.message
    });
  }
};

const checkManager = (departmentId = null) => {
  return (req, res, next) => {
    try {
      const userRoles = req.user.roles || [];
      
      // Admin has full access
      const isAdmin = userRoles.some(role => role.role_code === 'ADMIN');
      if (isAdmin) {
        return next();
      }
      
      // Check if user is manager
      const isManager = userRoles.some(role => {
        if (role.role_code !== 'MANAGER') return false;
        
        // If department check required
        if (departmentId) {
          const deptId = typeof departmentId === 'function' 
            ? departmentId(req) 
            : departmentId;
          
          return role.scope_type === 'hospital' || role.department_id === deptId;
        }
        
        return true;
      });
      
      if (!isManager) {
        return res.status(403).json({
          success: false,
          message: 'Chỉ Trưởng phòng mới có quyền thực hiện chức năng này'
        });
      }
      
      next();
    } catch (error) {
      console.error('Check manager error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền trưởng phòng',
        error: error.message
      });
    }
  };
};

const checkClerk = (scopeType = null) => {
  return (req, res, next) => {
    try {
      const userRoles = req.user.roles || [];
      
      // Admin has full access
      const isAdmin = userRoles.some(role => role.role_code === 'ADMIN');
      if (isAdmin) {
        return next();
      }
      
      // Check if user is clerk
      const isClerk = userRoles.some(role => {
        if (role.role_code !== 'CLERK' && role.role_code !== 'HOSPITAL_CLERK') {
          return false;
        }
        
        // If scope check required
        if (scopeType) {
          return role.scope_type === scopeType;
        }
        
        return true;
      });
      
      if (!isClerk) {
        return res.status(403).json({
          success: false,
          message: 'Chỉ Văn thư mới có quyền thực hiện chức năng này'
        });
      }
      
      next();
    } catch (error) {
      console.error('Check clerk error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền văn thư',
        error: error.message
      });
    }
  };
};

const checkKHTH = (req, res, next) => {
  try {
    const userRoles = req.user.roles || [];
    
    // Admin has full access
    const isAdmin = userRoles.some(role => role.role_code === 'ADMIN');
    if (isAdmin) {
      return next();
    }
    
    // Check if user is in KHTH department (department_type = 'special')
    // This requires checking user's department
    if (!req.user.department_id) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ nhân viên phòng KHTH mới có quyền thực hiện chức năng này'
      });
    }
    
    // Will be checked in controller by querying department type
    req.requireKHTH = true;
    next();
  } catch (error) {
    console.error('Check KHTH error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra quyền KHTH',
      error: error.message
    });
  }
};

const checkDocumentPermission = (action) => {
  return async (req, res, next) => {
    try {
      const userRoles = req.user.roles || [];
      const userId = req.user.userId;
      const departmentId = req.user.department_id;
      
      // Admin has full access
      const isAdmin = userRoles.some(role => role.role_code === 'ADMIN');
      if (isAdmin) {
        req.hasFullAccess = true;
        return next();
      }
      
      // Hospital clerk (Văn thư toàn viện) has full access
      const isHospitalClerk = userRoles.some(role => 
        role.role_code === 'HOSPITAL_CLERK' || 
        (role.role_code === 'CLERK' && role.scope_type === 'hospital')
      );
      
      if (isHospitalClerk) {
        req.hasFullAccess = true;
        return next();
      }
      
      // For specific actions
      switch (action) {
        case 'approve':
          // Only manager of the same department can approve
          const isManagerInDept = userRoles.some(role => 
            role.role_code === 'MANAGER' && 
            (role.scope_type === 'hospital' || role.department_id === departmentId)
          );
          
          if (!isManagerInDept) {
            return res.status(403).json({
              success: false,
              message: 'Chỉ Trưởng phòng mới có quyền duyệt tài liệu'
            });
          }
          break;
          
        case 'edit':
          // User can edit their own documents if status is draft/pending
          // This will be checked in controller
          req.canEditOwn = true;
          break;
          
        case 'delete':
          // User can delete own draft documents
          // Manager can delete department documents
          // Will be checked in controller
          req.canDeleteOwn = true;
          break;
      }
      
      next();
    } catch (error) {
      console.error('Check document permission error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền tài liệu',
        error: error.message
      });
    }
  };
};

const checkSchedulePermission = (action) => {
  return async (req, res, next) => {
    try {
      if (action === 'create') {
        return next();
      }

      const scheduleId = Number(req.params.id);
      if (Number.isNaN(scheduleId)) {
        return res.status(400).json({
          success: false,
          message: 'ID l???ch kh??ng h???p l???'
        });
      }

      const schedule = await Schedule.findById(scheduleId);
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Kh??ng t??m th???y l???ch'
        });
      }

      if (action === 'edit' && !SchedulePermissionService.canUpdate(req.user, schedule)) {
        return res.status(403).json({
          success: false,
          message: 'B???n kh??ng c?? quy???n ch???nh s???a l???ch n??y'
        });
      }

      req.schedule = schedule;
      next();
    } catch (error) {
      console.error('Check schedule permission error:', error);
      res.status(500).json({
        success: false,
        message: 'L???i ki???m tra quy???n l???ch',
        error: error.message
      });
    }
  };
};

module.exports = {
  checkRole,
  checkAdmin,
  checkManager,
  checkClerk,
  checkKHTH,
  checkDocumentPermission,
  checkSchedulePermission
};
