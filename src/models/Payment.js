const db = require('../config/database');

const Payment = {
  async findAll() {
    const { rows } = await db.query(
      `SELECT p.*,
              c.first_name || ' ' || c.last_name AS customer_name,
              b.booking_date
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       JOIN customers c ON c.id = b.customer_id
       ORDER BY p.created_at DESC`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await db.query(
      `SELECT p.*,
              c.first_name || ' ' || c.last_name AS customer_name
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       JOIN customers c ON c.id = b.customer_id
       WHERE p.id = $1`,
      [id]
    );
    return rows[0];
  },

  async findByBooking(bookingId) {
    const { rows } = await db.query(
      'SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC',
      [bookingId]
    );
    return rows;
  },

  async create(data) {
    const { rows } = await db.query(
      `INSERT INTO payments (booking_id, amount, method, status, transaction_ref, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.booking_id, data.amount, data.method, data.status, data.transaction_ref, data.paid_at]
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
      `UPDATE payments SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0];
  },

  async delete(id) {
    const { rowCount } = await db.query('DELETE FROM payments WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = Payment;
