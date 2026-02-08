# Hướng Dẫn Kết Nối API

## 📋 Tổng quan

Dự án đã được tích hợp đầy đủ API từ Backend sang Frontend với các tính năng:
- ✅ Axios instance với base URL và interceptors
- ✅ Tự động gửi JWT token trong mỗi request
- ✅ Xử lý lỗi 401 (Unauthorized) tự động
- ✅ Service layers cho tất cả endpoints
- ✅ Proxy configuration trong Vite

## 🚀 Cấu hình

### Backend (.env)
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Vite Proxy Configuration
```javascript
// vite.config.js
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

## 📁 Cấu trúc Services

```
FE/src/services/
├── api.js                 # Axios instance và interceptors
├── authService.js         # Authentication APIs
├── userService.js         # User management APIs
├── departmentService.js   # Department management APIs
├── roleService.js         # Role APIs
├── scheduleService.js     # Schedule management APIs
├── documentService.js     # Document management APIs
├── healthService.js       # Health check APIs
└── index.js              # Export tất cả services
```

## 🔐 Authentication Flow

### 1. Login
```javascript
import { authService } from '../services';

const handleLogin = async (email, password) => {
  const result = await authService.login(email, password);
  // Token và user info được tự động lưu vào localStorage
  // Token được tự động gửi kèm trong các request sau
};
```

### 2. Auto Token Injection
```javascript
// api.js - Request Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Auto Logout on 401
```javascript
// api.js - Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 📚 Sử dụng Services

### User Management
```javascript
import { userService } from '../services';

// Lấy tất cả users
const users = await userService.getAllUsers();

// Tạo user mới
await userService.createUser({
  name: "Nguyễn Văn A",
  email: "a@example.com",
  password: "123456",
  department_id: 1,
  role_id: 2
});

// Cập nhật user
await userService.updateUser(userId, { name: "New Name" });

// Xóa user
await userService.deleteUser(userId);

// Cập nhật trạng thái
await userService.updateUserStatus(userId, 'inactive');
```

### Department Management
```javascript
import { departmentService } from '../services';

// Lấy tất cả departments
const departments = await departmentService.getAllDepartments();

// Lấy members của department
const members = await departmentService.getDepartmentMembers(deptId);

// Tạo department mới
await departmentService.createDepartment({
  name: "Khoa Nội",
  description: "Khoa khám chữa bệnh nội khoa",
  location: "Tầng 3",
  head_id: 5
});

// Cập nhật department
await departmentService.updateDepartment(deptId, data);

// Xóa department
await departmentService.deleteDepartment(deptId);
```

### Schedule Management
```javascript
import { scheduleService } from '../services';

// Lấy tất cả schedules
const schedules = await scheduleService.getAllSchedules();

// Lấy schedules với filters
const schedules = await scheduleService.getAllSchedules({
  department_id: 1,
  status: 'approved',
  month: '2026-02'
});

// Tạo schedule mới
await scheduleService.createSchedule({
  user_id: 1,
  shift_id: 2,
  date: '2026-02-10',
  department_id: 1
});

// Submit schedule (Department clerk)
await scheduleService.submitSchedule(scheduleId);

// Approve schedule (KHTH only)
await scheduleService.approveSchedule(scheduleId);
```

### Document Management
```javascript
import { documentService } from '../services';

// Upload document
const formData = new FormData();
formData.append('file', fileObject);
formData.append('title', 'Document Title');
formData.append('category_id', 1);
formData.append('department_id', 1);
await documentService.uploadDocument(formData);

// Lấy documents của user
const myDocs = await documentService.getMyDocuments();

// Approve document (Manager only)
await documentService.approveDocument(docId);

// Reject document
await documentService.rejectDocument(docId, 'Lý do từ chối');

// Download document
const blob = await documentService.downloadDocument(docId);
```

## 🔄 Các Components Đã Cập Nhật

### ✅ AuthContext.jsx
- Sử dụng `authService.login()` thật
- Validate token on mount
- Auto refresh user profile

### ✅ Login.jsx
- Call API login thật
- Hiển thị lỗi từ server
- Redirect sau khi login thành công

### ✅ UserManagement.jsx
- Fetch users từ API
- CRUD operations với API thật
- Loading states và error handling

### ✅ DepartmentManagement.jsx
- Fetch departments từ API
- CRUD operations với API thật
- Dropdown users từ API

## 🎯 Các Components Cần Cập Nhật Tiếp

### Documents (DocumentList.jsx, DocumentUpload.jsx)
```javascript
// TODO: Replace mock data với documentService
import { documentService } from '../../services';
```

### Schedules (DutySchedule.jsx, MySchedule.jsx, WeeklySchedule.jsx)
```javascript
// TODO: Replace mock data với scheduleService
import { scheduleService } from '../../services';
```

### Profile.jsx
```javascript
// TODO: Sử dụng authService.getProfile() và authService.changePassword()
import { authService } from '../services';
```

## 🧪 Testing

### 1. Start Backend
```bash
cd BE
npm start
```

### 2. Start Frontend
```bash
cd FE
npm run dev
```

### 3. Test Login
- URL: http://localhost:3000/login
- Email: admin@hospital.com (hoặc email có trong database)
- Password: (mật khẩu đã set trong database)

### 4. Check Network Tab
- Mở Developer Tools > Network
- Kiểm tra requests có header `Authorization: Bearer <token>`
- Verify response data

## ⚠️ Lưu ý quan trọng

1. **CORS**: Backend đã config CORS cho `http://localhost:3000`
2. **Token Storage**: Token được lưu trong `localStorage` (có thể cân nhắc httpOnly cookies cho production)
3. **Error Handling**: Tất cả API calls cần wrap trong try-catch
4. **Loading States**: Sử dụng loading state khi gọi API
5. **Response Format**: Backend trả về `{ success, data, message }` hoặc `{ data }`

## 🐛 Debugging

### API không hoạt động?
```bash
# Check backend logs
# Check .env files
# Verify database connection
# Check network tab for errors
```

### 401 Unauthorized?
```bash
# Token hết hạn -> logout và login lại
# Token không đúng -> xóa localStorage và login lại
```

### CORS errors?
```bash
# Verify FRONTEND_URL in BE/.env
# Check backend CORS configuration
```

## 📖 API Documentation

Backend có Swagger documentation tại:
```
http://localhost:5000/api-docs
```

## 🎉 Hoàn thành!

Hệ thống đã được tích hợp API đầy đủ. Bạn có thể tiếp tục phát triển các tính năng còn lại bằng cách sử dụng các services đã tạo.
