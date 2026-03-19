const { pool } = require('../config/database');

/**
 * @swagger
 * /dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Lấy dữ liệu thống kê tổng hợp cho Dashboard
 *     responses:
 *       200:
 *         description: Thành công
 */
const getDashboardStats = async (req, res) => {
  try {
    // 1. Get Summary Counts
    const [[{ total_users }]] = await pool.execute("SELECT COUNT(*) as total_users FROM USER WHERE status = 'active'");
    const [[{ total_departments }]] = await pool.execute('SELECT COUNT(*) as total_departments FROM DEPARTMENT');
    const [[{ total_documents }]] = await pool.execute("SELECT COUNT(*) as total_documents FROM DOCUMENT WHERE deleted_at IS NULL AND status = 'approved'");
    const [[{ total_schedules }]] = await pool.execute("SELECT COUNT(*) as total_schedules FROM SCHEDULE WHERE status = 'approved'");

    // 2. Get Documents by Type (approved only)
    const [docsByType] = await pool.execute(`
        SELECT 
            SUM(CASE WHEN file_type LIKE '%wordprocessingml%' OR file_type LIKE '%msword%' THEN 1 ELSE 0 END) as word,
            SUM(CASE WHEN file_type LIKE '%spreadsheetml%' OR file_type LIKE '%ms-excel%' THEN 1 ELSE 0 END) as excel,
            SUM(CASE WHEN file_type LIKE '%pdf%' THEN 1 ELSE 0 END) as pdf,
            SUM(CASE WHEN file_type LIKE 'image/%' THEN 1 ELSE 0 END) as image
        FROM DOCUMENT
        WHERE deleted_at IS NULL AND status = 'approved'
    `);

    // 3. Get Documents by Department (approved only)
    const [docsByDept] = await pool.execute(`
      SELECT 
        dep.department_name as name,
        SUM(CASE WHEN d.file_type LIKE '%wordprocessingml%' OR d.file_type LIKE '%msword%' THEN 1 ELSE 0 END) as word,
        SUM(CASE WHEN d.file_type LIKE '%spreadsheetml%' OR d.file_type LIKE '%ms-excel%' THEN 1 ELSE 0 END) as excel,
        SUM(CASE WHEN d.file_type LIKE '%pdf%' THEN 1 ELSE 0 END) as pdf,
        SUM(CASE WHEN d.file_type LIKE 'image/%' THEN 1 ELSE 0 END) as image,
        COUNT(d.document_id) as total
      FROM DEPARTMENT dep
      LEFT JOIN DOCUMENT d ON dep.department_id = d.department_id AND d.deleted_at IS NULL AND d.status = 'approved'
      GROUP BY dep.department_id, dep.department_name
      ORDER BY total DESC
    `);

    res.json({
      success: true,
      data: {
        summary: {
          users: total_users || 0,
          departments: total_departments || 0,
          documents: total_documents || 0,
          schedules: total_schedules || 0
        },
        documentTypes: {
          word: parseInt(docsByType[0].word || 0),
          excel: parseInt(docsByType[0].excel || 0),
          pdf: parseInt(docsByType[0].pdf || 0),
          image: parseInt(docsByType[0].image || 0)
        },
        documentsByDepartment: docsByDept.map(d => ({
          ...d,
          word: parseInt(d.word || 0),
          excel: parseInt(d.excel || 0),
          pdf: parseInt(d.pdf || 0),
          image: parseInt(d.image || 0),
          total: parseInt(d.total || 0),
        }))
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê dashboard',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats
};
