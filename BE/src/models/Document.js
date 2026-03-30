const { pool } = require('../config/database');

class Document {
  static async create(documentData) {
    const {
      title, file_name, file_path, file_type, file_size,
      category_id, department_id, uploaded_by, status = 'pending'
    } = documentData;
    
    const [result] = await pool.execute(
      `INSERT INTO DOCUMENT (title, file_name, file_path, file_type, file_size,
                             category_id, department_id, uploaded_by, status,
                             created_at, updated_at, last_modified_by, last_modified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, NOW())`,
      [title, file_name, file_path, file_type, file_size, category_id, 
       department_id, uploaded_by, status, uploaded_by]
    );
    
    return result.insertId;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT d.*, c.category_name, dep.department_name,
             u.full_name as uploaded_by_name, u.username as uploaded_by_username,
             approver.full_name as approved_by_name
      FROM DOCUMENT d
      LEFT JOIN CATEGORY c ON d.category_id = c.category_id
      LEFT JOIN DEPARTMENT dep ON d.department_id = dep.department_id
      LEFT JOIN USER u ON d.uploaded_by = u.user_id
      LEFT JOIN USER approver ON d.approved_by = approver.user_id
      WHERE d.deleted_at IS NULL 
    `;
    
    const params = [];
    
    if (filters.search) {
      query += ` AND (d.title LIKE ? OR d.file_name LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    if (filters.status) {
      query += ` AND d.status = ?`;
      params.push(filters.status);
    }
    
    if (filters.category_id) {
      query += ` AND d.category_id = ?`;
      params.push(filters.category_id);
    }
    
    if (filters.department_id) {
      query += ` AND d.department_id = ?`;
      params.push(filters.department_id);
    }
    
    if (filters.uploaded_by) {
      query += ` AND d.uploaded_by = ?`;
      params.push(filters.uploaded_by);
    }
    
    query += ` ORDER BY d.created_at DESC`;
    
    if (filters.limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(filters.limit), parseInt(filters.offset || 0));
    }
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT d.*, c.category_name, dep.department_name,
              u.full_name as uploaded_by_name, u.username as uploaded_by_username,
              approver.full_name as approved_by_name
       FROM DOCUMENT d
       LEFT JOIN CATEGORY c ON d.category_id = c.category_id
       LEFT JOIN DEPARTMENT dep ON d.department_id = dep.department_id
       LEFT JOIN USER u ON d.uploaded_by = u.user_id
       LEFT JOIN USER approver ON d.approved_by = approver.user_id
       WHERE d.document_id = ? AND d.deleted_at IS NULL`,
      [id]
    );
    return rows[0];
  }

  static async update(id, documentData, userId) {
    const fields = [];
    const values = [];
    
    const allowedFields = ['title', 'category_id', 'status'];
    
    allowedFields.forEach(field => {
      if (documentData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(documentData[field]);
      }
    });
    
    // If content is updated, change status back to pending
    if (documentData.file_name || documentData.file_path) {
      fields.push('status = ?');
      values.push('pending');
      
      if (documentData.file_name) {
        fields.push('file_name = ?');
        values.push(documentData.file_name);
      }
      
      if (documentData.file_path) {
        fields.push('file_path = ?');
        values.push(documentData.file_path);
      }
      
      if (documentData.file_type) {
        fields.push('file_type = ?');
        values.push(documentData.file_type);
      }
      
      if (documentData.file_size) {
        fields.push('file_size = ?');
        values.push(documentData.file_size);
      }
    }
    
    fields.push('last_modified_by = ?', 'last_modified_at = NOW()', 'updated_at = NOW()');
    values.push(userId, id);
    
    const [result] = await pool.execute(
      `UPDATE DOCUMENT SET ${fields.join(', ')} WHERE document_id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }

  static async approve(id, approverId) {
    const [result] = await pool.execute(
      `UPDATE DOCUMENT 
       SET status = 'approved', approved_by = ?, approved_at = NOW(), updated_at = NOW()
       WHERE document_id = ?`,
      [approverId, id]
    );
    return result.affectedRows > 0;
  }

  static async reject(id, approverId) {
    const [result] = await pool.execute(
      `UPDATE DOCUMENT 
       SET status = 'rejected', approved_by = ?, approved_at = NOW(), updated_at = NOW()
       WHERE document_id = ?`,
      [approverId, id]
    );
    return result.affectedRows > 0;
  }

  static async softDelete(id) {
    const [result] = await pool.execute(
      'UPDATE DOCUMENT SET deleted_at = NOW() WHERE document_id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async hardDelete(id) {
    const [result] = await pool.execute(
      'DELETE FROM DOCUMENT WHERE document_id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getStats(departmentId = null) {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
      FROM DOCUMENT
      WHERE deleted_at IS NULL
    `;
    
    const params = [];
    
    if (departmentId) {
      query += ` AND department_id = ?`;
      params.push(departmentId);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows[0];
  }
}

module.exports = Document;
