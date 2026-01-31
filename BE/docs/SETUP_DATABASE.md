# Hướng dẫn Setup Database từ AivenCloud

## Bước 1: Lấy thông tin kết nối từ AivenCloud

1. Đăng nhập vào [AivenCloud Console](https://console.aiven.io/)
2. Chọn MySQL service của bạn
3. Vào tab **Overview** hoặc **Connection Information**
4. Copy các thông tin sau:
   - **Service URI** hoặc **Host**
   - **Port** (thường là 3306)
   - **User** (mặc định là `avnadmin`)
   - **Password**
   - **Database** (mặc định là `defaultdb`)

## Bước 2: Cập nhật file .env

1. Copy file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

2. Mở file `.env` và cập nhật thông tin:
```env
# Database Configuration
DB_HOST=your-service-name-your-project.aivencloud.com
DB_PORT=3306
DB_USER=avnadmin
DB_PASSWORD=your-password-from-aiven
DB_NAME=defaultdb
DB_SSL=true

# Azure Storage (lấy từ Azure Portal -> Storage Account -> Access Keys)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER_NAME=hospital-documents

# JWT Secret (đổi thành chuỗi bí mật của bạn)
JWT_SECRET=your-secret-key-at-least-32-characters-long
```

## Bước 3: Chạy script setup database

Script sẽ tự động:
- Kết nối đến AivenCloud MySQL
- Đọc file `database/schema.sql`
- Tạo tất cả các bảng
- Insert dữ liệu mẫu (roles, departments, categories, admin user)

```bash
npm run setup
```

**Output mong đợi:**
```
🚀 Bắt đầu thiết lập database...

📡 Đang kết nối đến MySQL...
✅ Kết nối thành công!

📄 Đang đọc file schema.sql...
📝 Tìm thấy 50+ câu lệnh SQL

⚙️  Đang thực thi schema...
   Đã thực thi 5/50 câu lệnh...
   Đã thực thi 10/50 câu lệnh...
   ...

✅ Hoàn thành: 50 câu lệnh thành công, 0 lỗi

🔍 Kiểm tra các bảng đã tạo:
✅ Các bảng đã được tạo:
   - DEPARTMENT
   - USER
   - ROLE
   - USER_ROLE
   - CATEGORY
   - DOCUMENT
   - SCHEDULE
   - SHIFT
   - SHIFT_ASSIGNMENT

📊 Kiểm tra dữ liệu mẫu:
   - ROLE: 5 bản ghi
   - DEPARTMENT: 6 bản ghi
   - USER: 1 bản ghi
   - CATEGORY: 5 bản ghi

🎉 Setup database hoàn tất!
```

## Bước 4: Tạo password cho admin

Mật khẩu admin trong schema là placeholder, cần generate hash mới:

```bash
# Generate bcrypt hash cho password "admin123"
npm run hash admin123

# Output: $2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Copy hash vừa tạo và update vào database:

### Cách 1: Dùng script Node.js

Tạo file `scripts/updateAdminPassword.js`:
```javascript
const pool = require('../src/config/database');

async function updatePassword() {
  const hash = 'paste-your-hash-here';
  await pool.execute(
    'UPDATE USER SET password_hash = ? WHERE user_id = 1',
    [hash]
  );
  console.log('✅ Đã cập nhật password cho admin');
}

updatePassword().then(() => process.exit(0));
```

Chạy: `node scripts/updateAdminPassword.js`

### Cách 2: Dùng AivenCloud Web Console

1. Vào AivenCloud Console → Your Service → **Query Editor**
2. Chạy SQL:
```sql
UPDATE USER 
SET password_hash = '$2b$10$xxx...' 
WHERE user_id = 1;
```

### Cách 3: Dùng MySQL Client (nếu có)

```bash
mysql -h your-host.aivencloud.com -u avnadmin -p --ssl-mode=REQUIRED defaultdb

# Trong MySQL prompt:
UPDATE USER SET password_hash = '$2b$10$xxx...' WHERE user_id = 1;
```

## Bước 5: Khởi động server

```bash
npm run dev
```

**Kiểm tra:**
- Console log: `✅ Database connected successfully`
- Console log: `✅ Azure Blob Storage initialized`
- Health check: http://localhost:5000/health
- Swagger docs: http://localhost:5000/api-docs

## Bước 6: Test login

```bash
# Test với Swagger hoặc curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Response mong đợi:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Xử lý lỗi thường gặp

### Lỗi: ECONNREFUSED
```
❌ Error: connect ECONNREFUSED
```
**Nguyên nhân:** Không kết nối được đến MySQL
**Giải pháp:**
- Kiểm tra DB_HOST và DB_PORT trong .env
- Kiểm tra MySQL service đang chạy trên AivenCloud
- Kiểm tra IP whitelist trong AivenCloud (nếu có)

### Lỗi: ER_ACCESS_DENIED_ERROR
```
❌ Error: Access denied for user
```
**Nguyên nhân:** Sai username/password
**Giải pháp:**
- Kiểm tra lại DB_USER và DB_PASSWORD
- Reset password trong AivenCloud console nếu cần

### Lỗi: ER_BAD_DB_ERROR
```
❌ Error: Unknown database 'hospital_management'
```
**Nguyên nhân:** Database không tồn tại
**Giải pháp:**
- Đổi DB_NAME thành `defaultdb` (database mặc định của Aiven)
- Hoặc tạo database mới trên AivenCloud

### Lỗi: SSL Connection Error
```
❌ Error: SSL connection error
```
**Giải pháp:**
- Đảm bảo `DB_SSL=true` trong .env
- AivenCloud yêu cầu SSL connection

## Kiểm tra sau khi setup

### 1. Kiểm tra bảng
```sql
SHOW TABLES;
-- Phải có 9 bảng
```

### 2. Kiểm tra dữ liệu
```sql
SELECT * FROM ROLE;              -- 5 roles
SELECT * FROM DEPARTMENT;        -- 6 departments  
SELECT * FROM USER;              -- 1 admin user
SELECT * FROM CATEGORY;          -- 5 categories
```

### 3. Kiểm tra admin user
```sql
SELECT user_id, username, full_name, email, department_id 
FROM USER 
WHERE user_id = 1;
```

### 4. Kiểm tra admin roles
```sql
SELECT u.username, r.role_name, ur.scope_type, ur.scope_id
FROM USER u
JOIN USER_ROLE ur ON u.user_id = ur.user_id
JOIN ROLE r ON ur.role_id = r.role_id
WHERE u.user_id = 1;
-- Admin phải có role ADMIN với scope hospital
```

## Tài liệu tham khảo

- [AivenCloud MySQL Documentation](https://docs.aiven.io/docs/products/mysql)
- [MySQL Connection with SSL](https://dev.mysql.com/doc/refman/8.0/en/using-encrypted-connections.html)
- API Documentation: http://localhost:5000/api-docs (sau khi start server)
