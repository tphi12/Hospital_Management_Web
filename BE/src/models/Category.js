const { pool } = require('../config/database');

class Category {
  static async findAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM CATEGORY ORDER BY category_name'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM CATEGORY WHERE category_id = ?',
      [id]
    );
    return rows[0];
  }

  static async create(categoryData) {
    const { category_name, description } = categoryData;
    
    const [result] = await pool.execute(
      'INSERT INTO CATEGORY (category_name, description, created_at) VALUES (?, ?, NOW())',
      [category_name, description]
    );
    
    return result.insertId;
  }
}

module.exports = Category;
