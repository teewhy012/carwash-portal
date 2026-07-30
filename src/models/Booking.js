const db = require('../config/database');

const Booking = {
  async findAll() {
    const { rows } = await db.query(
      `SELECT b.*,
              c.first_name || ' ' || c.last_name AS customer_name,
              c.phone AS customer_phone,
              v.license_plate,
              v.make || ' ' || v.model AS vehicle_name,
              s.name AS service_name,
              s.price AS service_price,
              e.first_name || ' ' || e.last_name AS employee_name
       FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       JOIN vehicles v ON v.id = b.vehicle_id
       JOIN services s ON s.id = b.service_id
       LEFT JOIN employees e ON e.id = b.employee_id
       ORDER BY b.booking_date DESC, b.booking_time DESC`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await db.query(
      `SELECT b.*,
              c.first_name || ' ' || c.last_name AS customer_name,
              c.phone AS customer_phone,
              v.license_plate,
              v.make || ' ' || v.model AS vehicle_name,
              s.name AS service_name,
              s.price AS service_price,
              e.first_name || ' ' || e.last_name AS employee_name
       FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       JOIN vehicles v ON v.id = b.vehicle_id
       JOIN services s ON s.id = b.service_id
       LEFT JOIN employees e ON e.id = b.employee_id
       WHERE b.id = $1`,
      [id]
    );
    return rows[0];
  },

  async findByCustomer(customerId) {
    const { rows } = await db.query(
      `SELECT b.*,
              s.name AS service_name,
              v.license_plate
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       JOIN vehicles v ON v.id = b.vehicle_id
       WHERE b.customer_id = $1
       ORDER BY b.booking_date DESC`,
      [customerId]
    );
    return rows;
  },

  async findByDate(date) {
    const { rows } = await db.query(
      `SELECT b.*,
              c.first_name || ' ' || c.last_name AS customer_name,
              v.license_plate,
              s.name AS service_name,
              e.first_name || ' ' || e.last_name AS employee_name
       FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       JOIN vehicles v ON v.id = b.vehicle_id
       JOIN services s ON s.id = b.service_id
       LEFT JOIN employees e ON e.id = b.employee_id
       WHERE b.booking_date = $1
       ORDER BY b.booking_time`,
      [date]
    );
    return rows;
  },

  async create(data) {
    const { rows } = await db.query(
      `INSERT INTO bookings (customer_id, vehicle_id, service_id, employee_id, booking_date, booking_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.customer_id, data.vehicle_id, data.service_id, data.employee_id, data.booking_date, data.booking_time, data.notes]
    );
    return rows[0];
  },

  async updateStatus(id, status) {
    const { rows } = await db.query(
      `UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
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
      `UPDATE bookings SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0];
  },

  async delete(id) {
    const { rowCount } = await db.query('DELETE FROM bookings WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = Booking;
