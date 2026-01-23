-- Create Database
CREATE DATABASE IF NOT EXISTS hospital_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hospital_management;

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'VAN_THU', 'TRUONG_PHONG', 'VAN_THU_PHONG_BAN', 'NHAN_VIEN', 'KHTH') DEFAULT 'NHAN_VIEN',
    departmentId INT,
    isLocked BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_departmentId (departmentId),
    INDEX idx_role (role)
);

-- Departments Table
CREATE TABLE IF NOT EXISTS Departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(200),
    managerId INT,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_managerId (managerId)
);

-- Documents Table
CREATE TABLE IF NOT EXISTS Documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    filePath VARCHAR(500),
    fileType VARCHAR(50),
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    departmentId INT NOT NULL,
    uploadedBy INT NOT NULL,
    approvedBy INT,
    approvedAt DATETIME,
    rejectionReason TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_title (title),
    INDEX idx_status (status),
    INDEX idx_departmentId (departmentId),
    INDEX idx_uploadedBy (uploadedBy),
    FOREIGN KEY (departmentId) REFERENCES Departments(id),
    FOREIGN KEY (uploadedBy) REFERENCES Users(id),
    FOREIGN KEY (approvedBy) REFERENCES Users(id)
);

-- Schedules Table
CREATE TABLE IF NOT EXISTS Schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    weekStart DATE NOT NULL,
    weekEnd DATE NOT NULL,
    departmentId INT NOT NULL,
    createdBy INT NOT NULL,
    status ENUM('DRAFT', 'SUBMITTED', 'APPROVED') DEFAULT 'DRAFT',
    filePath VARCHAR(500),
    approvedBy INT,
    approvedAt DATETIME,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_weekStart (weekStart),
    INDEX idx_status (status),
    INDEX idx_departmentId (departmentId),
    FOREIGN KEY (departmentId) REFERENCES Departments(id),
    FOREIGN KEY (createdBy) REFERENCES Users(id),
    FOREIGN KEY (approvedBy) REFERENCES Users(id)
);

-- ScheduleDetails Table
CREATE TABLE IF NOT EXISTS ScheduleDetails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scheduleId INT NOT NULL,
    userId INT NOT NULL,
    date DATE NOT NULL,
    shift ENUM('SANG', 'CHIEU', 'TOI', 'DEM') NOT NULL,
    notes VARCHAR(500),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_scheduleId (scheduleId),
    INDEX idx_userId (userId),
    INDEX idx_date (date),
    FOREIGN KEY (scheduleId) REFERENCES Schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Add Foreign Keys for Users
ALTER TABLE Users 
ADD CONSTRAINT fk_users_department 
FOREIGN KEY (departmentId) REFERENCES Departments(id) ON DELETE SET NULL;

-- Add Foreign Keys for Departments
ALTER TABLE Departments 
ADD CONSTRAINT fk_departments_manager 
FOREIGN KEY (managerId) REFERENCES Users(id) ON DELETE SET NULL;

-- Insert Sample Admin User (password: admin123)
INSERT INTO Users (fullName, username, email, phone, password, role) 
VALUES (
    'Administrator',
    'admin',
    'admin@hospital.com',
    '0123456789',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'ADMIN'
);
