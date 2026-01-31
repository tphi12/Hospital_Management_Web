const { pool } = require('../config/database');
const { BlobServiceClient } = require('@azure/storage-blob');

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Kiểm tra trạng thái server, database, và Azure Storage
 *     responses:
 *       200:
 *         description: Server đang hoạt động tốt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   example: 2024-01-15T10:30:00.000Z
 *                 uptime:
 *                   type: number
 *                   example: 3600
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: connected
 *                         responseTime:
 *                           type: number
 *                           example: 15
 *                     storage:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: connected
 *                         responseTime:
 *                           type: number
 *                           example: 25
 *                 system:
 *                   type: object
 *                   properties:
 *                     memory:
 *                       type: object
 *                     cpu:
 *                       type: object
 *       503:
 *         description: Service unavailable - có service không hoạt động
 */
exports.getHealth = async (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: await checkDatabase(),
        storage: await checkAzureStorage()
      },
      system: {
        memory: {
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100) + '%'
        },
        cpu: {
          usage: process.cpuUsage()
        },
        node: process.version,
        platform: process.platform
      }
    };

    // Kiểm tra nếu có service nào down
    const allServicesHealthy = 
      healthCheck.services.database.status === 'connected' &&
      healthCheck.services.storage.status === 'connected';

    if (!allServicesHealthy) {
      healthCheck.status = 'degraded';
      return res.status(503).json(healthCheck);
    }

    res.json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/health/db:
 *   get:
 *     summary: Database health check
 *     tags: [Health]
 *     description: Kiểm tra kết nối database
 *     responses:
 *       200:
 *         description: Database connected
 *       503:
 *         description: Database disconnected
 */
exports.getDbHealth = async (req, res) => {
  try {
    const dbHealth = await checkDatabase();
    
    if (dbHealth.status === 'connected') {
      res.json(dbHealth);
    } else {
      res.status(503).json(dbHealth);
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/health/storage:
 *   get:
 *     summary: Azure Storage health check
 *     tags: [Health]
 *     description: Kiểm tra kết nối Azure Blob Storage
 *     responses:
 *       200:
 *         description: Storage connected
 *       503:
 *         description: Storage disconnected
 */
exports.getStorageHealth = async (req, res) => {
  try {
    const storageHealth = await checkAzureStorage();
    
    if (storageHealth.status === 'connected') {
      res.json(storageHealth);
    } else {
      res.status(503).json(storageHealth);
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Liveness probe
 *     tags: [Health]
 *     description: Kiểm tra server có đang chạy không (cho Kubernetes)
 *     responses:
 *       200:
 *         description: Server is alive
 */
exports.getLiveness = (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
};

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Readiness probe
 *     tags: [Health]
 *     description: Kiểm tra server đã sẵn sàng nhận request chưa (cho Kubernetes)
 *     responses:
 *       200:
 *         description: Server is ready
 *       503:
 *         description: Server is not ready
 */
exports.getReadiness = async (req, res) => {
  try {
    // Kiểm tra tất cả dependencies
    const [dbHealth, storageHealth] = await Promise.all([
      checkDatabase(),
      checkAzureStorage()
    ]);

    const isReady = 
      dbHealth.status === 'connected' &&
      storageHealth.status === 'connected';

    if (isReady) {
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbHealth.status,
          storage: storageHealth.status
        }
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbHealth,
          storage: storageHealth
        }
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

// Helper functions
async function checkDatabase() {
  const start = Date.now();
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    const responseTime = Date.now() - start;
    
    return {
      status: 'connected',
      responseTime: responseTime + 'ms',
      message: 'Database connection is healthy'
    };
  } catch (error) {
    return {
      status: 'disconnected',
      responseTime: (Date.now() - start) + 'ms',
      message: error.message
    };
  }
}

async function checkAzureStorage() {
  const start = Date.now();
  try {
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      return {
        status: 'not configured',
        responseTime: '0ms',
        message: 'Azure Storage connection string not configured'
      };
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    
    // Test bằng cách list containers (lightweight operation)
    const iterator = blobServiceClient.listContainers().byPage({ maxPageSize: 1 });
    await iterator.next();
    
    const responseTime = Date.now() - start;
    
    return {
      status: 'connected',
      responseTime: responseTime + 'ms',
      message: 'Azure Blob Storage connection is healthy'
    };
  } catch (error) {
    return {
      status: 'disconnected',
      responseTime: (Date.now() - start) + 'ms',
      message: error.message
    };
  }
}
