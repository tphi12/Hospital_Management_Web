require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const db = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/departments', require('./routes/department.routes'));
app.use('/api/documents', require('./routes/document.routes'));
app.use('/api/schedules', require('./routes/schedule.routes'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Hospital Management API is running', docs: '/api-docs' });
});

// Database connection and sync
db.authenticate()
  .then(() => {
    console.log('✓ Database connected successfully');
    return db.sync({ alter: true });
  })
  .then(() => {
    console.log('✓ Database synced');
  })
  .catch(err => {
    console.error('✗ Database connection error:', err);
  });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server is running on port ${PORT}`);
  console.log(`✓ API Documentation: http://localhost:${PORT}/api-docs`);
});
