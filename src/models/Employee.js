const db = require('../config/database');

const Employee = {
  async findAll() {
    const { rows } = await db.query(
      'SELECT * FROM employees ORDER BY hire_date DESC'
    );
    return rows;
  },

  async findActive() {
    const { rows } = await db.query(
      'SELECT * FROM employees WHERE is_active = true ORDER BY first_name'
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await db.query('SELECT * FROM employees WHERE id = $1', [id]);
    return rows[0];
  },

  async create(data) {
    const { rows } = await db.query(
      `INSERT INTO employees (first_name, last_name, email, phone, role, hire_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.first_name, data.last_name, data.email, data.phone, data.role, data.hire_date]
    );
    return rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await db.query(
      `UPDATE employees SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0];
  },

  async delete(id) {
    const { rowCount } = await db.query('DELETE FROM employees WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = Employee;
