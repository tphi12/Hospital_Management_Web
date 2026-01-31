# Hospital Management System - Backend API

Hệ thống quản lý tài liệu và lịch trực cho bệnh viện được xây dựng bằng Node.js, Express, MySQL và Azure Blob Storage.

## 📋 Tính năng chính

### 1. Quản lý người dùng (ADMIN)
- Tạo, sửa, xóa tài khoản người dùng
- Khóa/Mở khóa tài khoản
- Phân quyền theo role và scope (department/hospital)
- Tìm kiếm người dùng

### 2. Quản lý phòng ban (ADMIN)
- Tạo, sửa, xóa phòng ban
- Xem danh sách thành viên phòng ban
- Phân loại phòng ban (simple, admin, special)

### 3. Quản lý tài liệu
- Upload tài liệu lên Azure Blob Storage
- Phê duyệt tài liệu (Trưởng phòng)
- Quản lý tài liệu toàn viện (Văn thư)
- Chỉnh sửa, xóa tài liệu theo quyền
- Tìm kiếm và lọc tài liệu

### 4. Quản lý lịch trực
- Văn thư phòng ban tạo lịch trực
- Gửi lịch trực cho phòng KHTH
- KHTH tổng hợp và duyệt lịch trực
- Nhân viên xem lịch trực đã được duyệt

### 5. Quản lý lịch công tác tuần
- KHTH tạo và quản lý lịch công tác tuần
- Public lịch cho toàn bệnh viện
- Nhân viên xem và xuất PDF

## 🚀 Cài đặt

### Yêu cầu
- Node.js >= 16.x
- MySQL >= 8.0
- Azure Storage Account

### Bước 1: Cài đặt dependencies

```bash
npm install
```

### Bước 2: Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các thông tin trong `.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (MySQL - AivenCloud)
DB_HOST=your-mysql-host.aivencloud.com
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=hospital_management
DB_SSL=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Azure Blob Storage Configuration
AZURE_STORAGE_CONNECTION_STRING=your-azure-storage-connection-string
AZURE_STORAGE_CONTAINER_NAME=hospital-documents

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### Bước 3: Tạo database schema

Chạy file SQL để tạo database:

```bash
# Connect to your MySQL database and run:
mysql -h your-host -u your-user -p your-database < database/schema.sql
```

Hoặc import thủ công qua MySQL Workbench/phpMyAdmin.

### Bước 4: Tạo admin user password hash

Chạy lệnh để tạo password hash cho admin:

```bash
node -e "console.log(require('bcryptjs').hashSync('admin123', 10))"
```

Copy hash và update vào database trong bảng USER cho admin user.

### Bước 5: Chạy server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

## 📚 API Documentation

Sau khi chạy server, truy cập Swagger documentation tại:

```
http://localhost:5000/api-docs
```

## 🔑 Authentication

API sử dụng JWT Bearer Token authentication.

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 1,
      "username": "admin",
      "full_name": "Administrator",
      "roles": [...]
    }
  }
}
```

### Sử dụng token

Thêm header vào mọi request:

```
Authorization: Bearer <your-token>
```

## 📁 Cấu trúc project

```
BE/
├── src/
│   ├── config/           # Cấu hình database, Azure, Swagger
│   │   ├── database.js
│   │   ├── azureStorage.js
│   │   └── swagger.js
│   ├── controllers/      # Business logic
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── departmentController.js
│   │   ├── documentController.js
│   │   ├── scheduleController.js
│   │   └── shiftController.js
│   ├── middleware/       # Middleware functions
│   │   ├── auth.js
│   │   ├── authorize.js
│   │   ├── upload.js
│   │   └── validate.js
│   ├── models/          # Database models
│   │   ├── User.js
│   │   ├── Department.js
│   │   ├── Document.js
│   │   ├── Schedule.js
│   │   └── Shift.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── departmentRoutes.js
│   │   ├── documentRoutes.js
│   │   └── scheduleRoutes.js
│   └── server.js        # Main server file
├── database/
│   └── schema.sql       # Database schema
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🎭 Roles & Permissions

### ADMIN
- Full quyền trên toàn bộ hệ thống
- Quản lý users, departments
- Bypass mọi permission checks

### HOSPITAL_CLERK (Văn thư toàn viện)
- Quản lý tài liệu toàn bệnh viện
- Thêm, sửa, xóa tài liệu kể cả đã duyệt
- Scope: hospital

### MANAGER (Trưởng phòng)
- Duyệt tài liệu của phòng ban
- Quản lý nhân viên phòng ban
- Scope: department

### CLERK (Văn thư phòng ban)
- Tạo và gửi lịch trực phòng ban
- Upload tài liệu phòng ban
- Scope: department

### STAFF (Nhân viên)
- Upload tài liệu
- Xem tài liệu đã được duyệt
- Xem lịch trực
- Chỉnh sửa tài liệu của mình (trước khi duyệt)

## 🔐 Phân quyền Logic

Hệ thống sử dụng công thức phân quyền:

```
QUYỀN = ROLE + SCOPE + ENTITY_STATUS + OWNERSHIP
```

### Ví dụ: Duyệt tài liệu
```javascript
IF user.role = MANAGER
AND document.department = user.department
AND document.status = 'pending'
→ Được duyệt
```

### Ví dụ: Chỉnh sửa lịch
```javascript
IF schedule.status = 'draft'
  → source_department có quyền sửa

IF schedule.status = 'submitted' OR 'approved'
  → owner_department (KHTH) có quyền sửa
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `POST /api/auth/change-password` - Đổi mật khẩu

### Users (ADMIN only)
- `GET /api/users` - Danh sách users
- `GET /api/users/:id` - Chi tiết user
- `POST /api/users` - Tạo user mới
- `PUT /api/users/:id` - Cập nhật user
- `PATCH /api/users/:id/status` - Khóa/Mở khóa
- `DELETE /api/users/:id` - Xóa user
- `POST /api/users/:id/roles` - Phân quyền

### Departments
- `GET /api/departments` - Danh sách phòng ban
- `GET /api/departments/:id` - Chi tiết phòng ban
- `GET /api/departments/:id/members` - Thành viên
- `POST /api/departments` - Tạo mới (ADMIN)
- `PUT /api/departments/:id` - Cập nhật (ADMIN)
- `DELETE /api/departments/:id` - Xóa (ADMIN)

### Documents
- `GET /api/documents` - Danh sách tài liệu
- `GET /api/documents/:id` - Chi tiết tài liệu
- `POST /api/documents` - Upload tài liệu
- `PUT /api/documents/:id` - Cập nhật tài liệu
- `PATCH /api/documents/:id/approve` - Duyệt tài liệu
- `PATCH /api/documents/:id/reject` - Từ chối
- `DELETE /api/documents/:id` - Xóa tài liệu
- `GET /api/documents/stats` - Thống kê

### Schedules
- `GET /api/schedules` - Danh sách lịch
- `GET /api/schedules/:id` - Chi tiết lịch
- `POST /api/schedules` - Tạo lịch mới
- `PUT /api/schedules/:id` - Cập nhật lịch
- `PATCH /api/schedules/:id/submit` - Gửi lịch cho KHTH
- `PATCH /api/schedules/:id/approve` - Duyệt lịch
- `DELETE /api/schedules/:id` - Xóa lịch

### Shifts
- `GET /api/shifts/:id` - Chi tiết ca trực
- `POST /api/shifts` - Tạo ca trực
- `PUT /api/shifts/:id` - Cập nhật ca trực
- `DELETE /api/shifts/:id` - Xóa ca trực
- `POST /api/shifts/:id/assign` - Phân công nhân viên
- `DELETE /api/shifts/assignments/:id` - Xóa phân công

### Categories
- `GET /api/categories` - Danh sách danh mục
- `POST /api/categories` - Tạo danh mục (ADMIN)

## 🔧 Troubleshooting

### Database connection error
- Kiểm tra thông tin kết nối trong `.env`
- Đảm bảo MySQL server đang chạy
- Kiểm tra firewall và SSL settings

### Azure Blob upload error
- Kiểm tra connection string
- Đảm bảo container đã được tạo
- Kiểm tra permissions

### JWT token expired
- Token mặc định hết hạn sau 7 ngày
- User cần đăng nhập lại để lấy token mới

## 📞 Support

Nếu có vấn đề, vui lòng liên hệ dev team.
