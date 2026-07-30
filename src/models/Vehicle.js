const db = require('../config/database');

const Vehicle = {
  async findAll() {
    const { rows } = await db.query(
      `SELECT v.*, c.first_name || ' ' || c.last_name AS customer_name
       FROM vehicles v
       JOIN customers c ON c.id = v.customer_id
       ORDER BY v.created_at DESC`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await db.query(
      `SELECT v.*, c.first_name || ' ' || c.last_name AS customer_name
       FROM vehicles v
       JOIN customers c ON c.id = v.customer_id
       WHERE v.id = $1`,
      [id]
    );
    return rows[0];
  },

  async findByCustomer(customerId) {
    const { rows } = await db.query(
      'SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId]
    );
    return rows;
  },

  async create(data) {
    const { rows } = await db.query(
      `INSERT INTO vehicles (customer_id, make, model, year, license_plate, color)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.customer_id, data.make, data.model, data.year, data.license_plate, data.color]
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
      `UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0];
  },

  async delete(id) {
    const { rowCount } = await db.query('DELETE FROM vehicles WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = Vehicle;
