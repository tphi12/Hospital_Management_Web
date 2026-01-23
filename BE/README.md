# Hospital Management System - Backend

Hệ thống quản lý tài liệu và lịch trực bệnh viện.

## Công nghệ sử dụng

- **Backend Framework**: Node.js + Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Token)
- **File Upload**: Multer
- **API Documentation**: Swagger UI

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình Database

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật thông tin database trong file `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hospital_management
DB_PORT=3306

JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

### 3. Tạo Database

Tạo database MySQL:

```sql
CREATE DATABASE hospital_management;
```

### 4. Chạy ứng dụng

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server sẽ chạy trên: `http://localhost:5000`

## API Documentation

Sau khi chạy server, truy cập Swagger UI tại:

**http://localhost:5000/api-docs**

## Cấu trúc API

### Authentication (`/api/auth`)
- `POST /login` - Đăng nhập
- `GET /me` - Lấy thông tin user hiện tại
- `POST /change-password` - Đổi mật khẩu

### Users (`/api/users`) - ADMIN only
- `POST /` - Tạo user mới
- `GET /` - Danh sách users (có search, filter)
- `GET /:id` - Chi tiết user
- `PUT /:id` - Cập nhật user
- `PATCH /:id/lock` - Khoá/Mở khoá user
- `DELETE /:id` - Xoá user

### Departments (`/api/departments`)
- `POST /` - Tạo phòng ban (ADMIN)
- `GET /` - Danh sách phòng ban
- `GET /:id` - Chi tiết phòng ban
- `GET /:id/members` - Xem thành viên (ADMIN)
- `PUT /:id` - Cập nhật phòng ban (ADMIN)
- `DELETE /:id` - Xoá phòng ban (ADMIN)

### Documents (`/api/documents`)
- `POST /` - Upload tài liệu
- `GET /` - Danh sách tài liệu (có search, filter)
- `GET /:id` - Chi tiết tài liệu
- `PUT /:id` - Cập nhật tài liệu
- `PATCH /:id/approve` - Duyệt/Từ chối tài liệu
- `DELETE /:id` - Xoá tài liệu

### Schedules (`/api/schedules`)
- `POST /` - Tạo lịch trực
- `GET /` - Danh sách lịch trực
- `GET /:id` - Chi tiết lịch trực
- `GET /my-schedule` - Lịch trực của tôi
- `PUT /:id` - Cập nhật lịch trực
- `PATCH /:id/submit` - Gửi lịch trực (VAN_THU_PHONG_BAN)
- `PATCH /:id/approve` - Duyệt lịch trực (KHTH)
- `DELETE /:id` - Xoá lịch trực

## Roles trong hệ thống

1. **ADMIN** - Quản trị viên
   - Quản lý users, phòng ban
   - Toàn quyền trên hệ thống

2. **VAN_THU** - Văn thư toàn bệnh viện
   - Quản lý toàn bộ tài liệu
   - Có thể thêm, sửa, xoá mọi tài liệu

3. **TRUONG_PHONG** - Trưởng phòng
   - Duyệt tài liệu của phòng
   - Xem tài liệu toàn bệnh viện

4. **VAN_THU_PHONG_BAN** - Văn thư phòng ban
   - Sắp xếp lịch trực phòng ban
   - Upload, chỉnh sửa tài liệu

5. **NHAN_VIEN** - Nhân viên
   - Upload tài liệu
   - Xem tài liệu đã được duyệt
   - Xem lịch trực của mình

6. **KHTH** - Phòng KHTH
   - Quản lý lịch trực toàn bệnh viện
   - Tổng hợp và duyệt lịch trực

## Authentication

API sử dụng JWT Bearer Token. Sau khi login, sử dụng token trong header:

```
Authorization: Bearer <your_token>
```

## File Upload

- Thư mục upload: `./uploads`
- Kích thước file tối đa: 10MB
- Định dạng hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG

## Database Schema

### Users
- id, fullName, username, email, phone
- password (hashed), role, departmentId
- isLocked, createdAt, updatedAt

### Departments
- id, name, location, managerId
- description, createdAt, updatedAt

### Documents
- id, title, content, filePath, fileType
- status, departmentId, uploadedBy
- approvedBy, approvedAt, rejectionReason
- createdAt, updatedAt

### Schedules
- id, weekStart, weekEnd
- departmentId, createdBy, status
- filePath, approvedBy, approvedAt
- notes, createdAt, updatedAt

### ScheduleDetails
- id, scheduleId, userId
- date, shift, notes
- createdAt, updatedAt

## License

ISC
