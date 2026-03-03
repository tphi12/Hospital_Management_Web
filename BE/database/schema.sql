-- Hospital Management System Database Schema
-- MySQL Database Script

-- Drop tables if exist (in reverse order of dependencies)
DROP TABLE IF EXISTS WEEKLY_WORK_ITEM;
DROP TABLE IF EXISTS SHIFT_ASSIGNMENT;
DROP TABLE IF EXISTS SHIFT;
DROP TABLE IF EXISTS SCHEDULE;
DROP TABLE IF EXISTS DOCUMENT;
DROP TABLE IF EXISTS CATEGORY;
DROP TABLE IF EXISTS USER_ROLE;
DROP TABLE IF EXISTS ROLE;
DROP TABLE IF EXISTS USER;
DROP TABLE IF EXISTS DEPARTMENT;

-- Create DEPARTMENT table
CREATE TABLE DEPARTMENT (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_code VARCHAR(50) UNIQUE NOT NULL,
    department_name VARCHAR(200) NOT NULL,
    department_type ENUM('simple', 'admin', 'special') NOT NULL DEFAULT 'simple',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_department_type (department_type),
    INDEX idx_department_code (department_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create USER table
CREATE TABLE USER (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department_id INT,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    username VARCHAR(100) UNIQUE NOT NULL,
    employee_code VARCHAR(50),
    avatar_path VARCHAR(500),
    gender ENUM('male', 'female', 'other'),
    date_of_birth DATE,
    last_login_at TIMESTAMP NULL,
    FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id) ON DELETE SET NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_employee_code (employee_code),
    INDEX idx_department_id (department_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ROLE table
CREATE TABLE ROLE (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    INDEX idx_role_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create USER_ROLE table
CREATE TABLE USER_ROLE (
    user_role_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    scope_type ENUM('department', 'hospital') NOT NULL DEFAULT 'department',
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES ROLE(role_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_role_dept (user_id, role_id, department_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id),
    INDEX idx_scope_type (scope_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create CATEGORY table
CREATE TABLE CATEGORY (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_name (category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create DOCUMENT table
CREATE TABLE DOCUMENT (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    category_id INT,
    department_id INT,
    uploaded_by INT NOT NULL,
    status ENUM('draft', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_modified_by INT,
    last_modified_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (category_id) REFERENCES CATEGORY(category_id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES USER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES USER(user_id) ON DELETE SET NULL,
    FOREIGN KEY (last_modified_by) REFERENCES USER(user_id) ON DELETE SET NULL,
    INDEX idx_title (title(255)),
    INDEX idx_status (status),
    INDEX idx_category_id (category_id),
    INDEX idx_department_id (department_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create SCHEDULE table
CREATE TABLE SCHEDULE (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_type ENUM('duty', 'weekly_work') NOT NULL,
    department_id INT NOT NULL,
    week INT NOT NULL,
    year INT NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    status ENUM('draft', 'submitted', 'approved') NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    source_department_id INT,
    owner_department_id INT,
    FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES USER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (source_department_id) REFERENCES DEPARTMENT(department_id) ON DELETE SET NULL,
    FOREIGN KEY (owner_department_id) REFERENCES DEPARTMENT(department_id) ON DELETE SET NULL,
    INDEX idx_schedule_type (schedule_type),
    INDEX idx_week_year (week, year),
    INDEX idx_week_year_type (week, year, schedule_type),
    INDEX idx_status (status),
    INDEX idx_department_id (department_id),
    UNIQUE KEY unique_schedule (schedule_type, department_id, week, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create SHIFT table
CREATE TABLE SHIFT (
    shift_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    department_id INT NOT NULL,
    shift_date DATE NOT NULL,
    shift_type ENUM('morning', 'afternoon', 'night') NOT NULL,
    note TEXT,
    start_time TIME,
    end_time TIME,
    max_staff INT DEFAULT 10,
    FOREIGN KEY (schedule_id) REFERENCES SCHEDULE(schedule_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id) ON DELETE CASCADE,
    INDEX idx_schedule_id (schedule_id),
    INDEX idx_shift_date (shift_date),
    INDEX idx_shift_type (shift_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create SHIFT_ASSIGNMENT table
CREATE TABLE SHIFT_ASSIGNMENT (
    shift_assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    shift_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('assigned', 'swapped', 'canceled') NOT NULL DEFAULT 'assigned',
    note TEXT,
    FOREIGN KEY (shift_id) REFERENCES SHIFT(shift_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE,
    INDEX idx_shift_id (shift_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create WEEKLY_WORK_ITEM table
CREATE TABLE WEEKLY_WORK_ITEM (
    weekly_work_item_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id         INT          NOT NULL,
    work_date           DATE         NOT NULL,
    content             TEXT         NOT NULL,
    location            VARCHAR(500) DEFAULT NULL,
    participants        TEXT         DEFAULT NULL,
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES SCHEDULE(schedule_id) ON DELETE CASCADE,
    INDEX idx_wwi_schedule_id (schedule_id),
    INDEX idx_wwi_work_date   (work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default roles
INSERT INTO ROLE (role_code, role_name, description) VALUES
('ADMIN', 'Quản trị viên', 'Quản lý toàn bộ hệ thống'),
('MANAGER', 'Trưởng phòng', 'Quản lý phòng ban, duyệt tài liệu'),
('CLERK', 'Văn thư phòng ban', 'Quản lý tài liệu và lịch trực của phòng ban'),
('HOSPITAL_CLERK', 'Văn thư toàn viện', 'Quản lý tài liệu toàn bệnh viện'),
('STAFF', 'Nhân viên', 'Nhân viên thông thường');

-- Insert default categories
INSERT INTO CATEGORY (category_name, description) VALUES
('Văn bản hành chính', 'Các văn bản hành chính của bệnh viện'),
('Quy trình chuyên môn', 'Quy trình chuyên môn y tế'),
('Báo cáo', 'Các loại báo cáo'),
('Thông báo', 'Thông báo nội bộ'),
('Tài liệu đào tạo', 'Tài liệu đào tạo nội bộ');

-- Insert sample departments
INSERT INTO DEPARTMENT (department_code, department_name, department_type, description) VALUES
('ADMIN', 'Ban Giám Đốc', 'admin', 'Ban lãnh đạo bệnh viện'),
('KHTH', 'Phòng Kế Hoạch Tổng Hợp', 'special', 'Phòng quản lý lịch trực và công tác tuần'),
('KHOA-NOI', 'Khoa Nội', 'simple', 'Khoa Nội tổng hợp'),
('KHOA-NGOAI', 'Khoa Ngoại', 'simple', 'Khoa Ngoại tổng hợp'),
('KHOA-SAN', 'Khoa Sản', 'simple', 'Khoa Sản phụ'),
('KHOA-NHI', 'Khoa Nhi', 'simple', 'Khoa Nhi');

-- Insert admin user (password: admin123)
INSERT INTO USER (full_name, email, password_hash, phone, username, employee_code, department_id, status) VALUES
('Administrator', 'admin@hospital.com', '$2a$10$YourHashedPasswordHere', '0123456789', 'admin', 'NV001', 1, 'active');

-- Assign admin role to admin user
INSERT INTO USER_ROLE (user_id, role_id, scope_type, department_id) VALUES
(1, 1, 'hospital', NULL);

-- Note: Replace password_hash with actual bcrypt hash
-- You can generate it by running: node -e "console.log(require('bcryptjs').hashSync('admin123', 10))"

COMMIT;
