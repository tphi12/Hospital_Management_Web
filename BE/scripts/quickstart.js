// Quick Start Guide for Hospital Management System Backend

console.log('\n🏥 Hospital Management System - Backend Setup Guide\n');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('📝 SETUP CHECKLIST:\n');

console.log('1. ✅ Dependencies installed (npm install completed)');
console.log('   → All required packages have been installed\n');

console.log('2. ⚠️  Configure .env file:');
console.log('   → Update DB_HOST with your AivenCloud MySQL host');
console.log('   → Update DB_USER and DB_PASSWORD');
console.log('   → Update DB_NAME (default: hospital_management)');
console.log('   → Update AZURE_STORAGE_CONNECTION_STRING');
console.log('   → Update AZURE_STORAGE_CONTAINER_NAME\n');

console.log('3. ⚠️  Setup Database:');
console.log('   → Run the SQL script: database/schema.sql');
console.log('   → This will create all tables and insert default data\n');

console.log('4. ⚠️  Generate Admin Password:');
console.log('   → Run: node scripts/generateHash.js admin123');
console.log('   → Copy the hash and update USER table\n');

console.log('5. 🚀 Start the server:');
console.log('   → Development: npm run dev');
console.log('   → Production: npm start\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('📚 USEFUL COMMANDS:\n');
console.log('npm run dev          - Start development server with auto-reload');
console.log('npm start            - Start production server');
console.log('npm test             - Run tests (not configured yet)\n');

console.log('🔗 ENDPOINTS:\n');
console.log('API Base:        http://localhost:5000/api');
console.log('Swagger Docs:    http://localhost:5000/api-docs');
console.log('Health Check:    http://localhost:5000/health\n');

console.log('🔑 DEFAULT CREDENTIALS (after setup):\n');
console.log('Username: admin');
console.log('Password: admin123\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('📖 For detailed documentation, see: README.md\n');
