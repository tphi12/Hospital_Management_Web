const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  console.log('🚀 Bắt đầu thiết lập database...\n');
  
  let connection;
  
  try {
    // Kết nối đến MySQL
    console.log('📡 Đang kết nối đến MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      multipleStatements: true // Cho phép chạy nhiều câu lệnh SQL
    });
    
    console.log('✅ Kết nối thành công!\n');
    
    // Đọc file schema.sql
    console.log('📄 Đang đọc file schema.sql...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Thực thi toàn bộ schema (multipleStatements = true)
    console.log('⚙️  Đang thực thi schema...');
    await connection.query(schema);
    console.log('✅ Schema đã được thực thi thành công!\n');
    
    // Kiểm tra các bảng đã tạo
    console.log('🔍 Kiểm tra các bảng đã tạo:');
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length > 0) {
      console.log('✅ Các bảng đã được tạo:');
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
      });
    } else {
      console.log('⚠️  Chưa có bảng nào được tạo');
    }
    
    // Kiểm tra dữ liệu mẫu
    console.log('\n📊 Kiểm tra dữ liệu mẫu:');
    try {
      const [roles] = await connection.query('SELECT COUNT(*) as count FROM ROLE');
      const [departments] = await connection.query('SELECT COUNT(*) as count FROM DEPARTMENT');
      const [users] = await connection.query('SELECT COUNT(*) as count FROM USER');
      const [categories] = await connection.query('SELECT COUNT(*) as count FROM CATEGORY');
      
      console.log(`   - ROLE: ${roles[0].count} bản ghi`);
      console.log(`   - DEPARTMENT: ${departments[0].count} bản ghi`);
      console.log(`   - USER: ${users[0].count} bản ghi`);
      console.log(`   - CATEGORY: ${categories[0].count} bản ghi`);
    } catch (error) {
      console.log('⚠️  Không thể đọc dữ liệu mẫu:', error.message);
    }
    
    // Hash password cho admin user
    console.log('\n🔐 Đang hash password cho admin user...');
    const bcrypt = require('bcryptjs');
    const adminPassword = 'admin123';
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    await connection.query(
      'UPDATE USER SET password_hash = ? WHERE user_id = 1',
      [passwordHash]
    );
    console.log('✅ Đã set password "admin123" cho admin user');
    
    console.log('\n🎉 Setup database hoàn tất!\n');
    console.log('📝 Thông tin đăng nhập:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  Nhớ đổi password sau khi login lần đầu!\n');
    console.log('📝 Bước tiếp theo:');
    console.log('   1. Khởi động server: npm run dev');
    console.log('   2. Truy cập Swagger: http://localhost:5000/api-docs');
    console.log('   3. Login với admin/admin123\n');
    
  } catch (error) {
    console.error('\n❌ Lỗi khi setup database:');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Hướng dẫn:');
      console.error('   - Kiểm tra DB_HOST và DB_PORT trong file .env');
      console.error('   - Đảm bảo MySQL service đang chạy trên AivenCloud');
      console.error('   - Kiểm tra firewall/network connection');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Hướng dẫn:');
      console.error('   - Kiểm tra DB_USER và DB_PASSWORD trong file .env');
      console.error('   - Đảm bảo user có quyền CREATE/INSERT trên database');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Hướng dẫn:');
      console.error('   - Database không tồn tại');
      console.error('   - Tạo database trên AivenCloud hoặc đổi DB_NAME trong .env');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Chạy script
setupDatabase();
