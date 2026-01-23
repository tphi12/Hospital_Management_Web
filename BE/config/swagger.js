const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hospital Management API',
      version: '1.0.0',
      description: 'API documentation for Hospital Document and Schedule Management System',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            fullName: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            role: { 
              type: 'string',
              enum: ['ADMIN', 'VAN_THU', 'TRUONG_PHONG', 'VAN_THU_PHONG_BAN', 'NHAN_VIEN', 'KHTH']
            },
            departmentId: { type: 'integer' },
            isLocked: { type: 'boolean' }
          }
        },
        Department: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            location: { type: 'string' },
            managerId: { type: 'integer' }
          }
        },
        Document: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            content: { type: 'string' },
            filePath: { type: 'string' },
            status: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'REJECTED']
            },
            departmentId: { type: 'integer' },
            uploadedBy: { type: 'integer' }
          }
        },
        Schedule: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            weekStart: { type: 'string', format: 'date' },
            weekEnd: { type: 'string', format: 'date' },
            departmentId: { type: 'integer' },
            status: {
              type: 'string',
              enum: ['DRAFT', 'SUBMITTED', 'APPROVED']
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
