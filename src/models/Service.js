const db = require('../config/database');

const Service = {
  async findAll() {
    const { rows } = await db.query(
      'SELECT * FROM services ORDER BY category, name'
    );
    return rows;
  },

  async findActive() {
    const { rows } = await db.query(
      'SELECT * FROM services WHERE is_active = true ORDER BY category, name'
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await db.query('SELECT * FROM services WHERE id = $1', [id]);
    return rows[0];
  },

  async create(data) {
    const { rows } = await db.query(
      `INSERT INTO services (name, description, category, duration_minutes, price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.name, data.description, data.category, data.duration_minutes, data.price]
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
      `UPDATE services SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0];
  },

  async delete(id) {
    const { rowCount } = await db.query('DELETE FROM services WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = Service;
