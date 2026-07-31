const db = require('../config/database');

const PosDocument = {
  async upsert(docType, docKey, payload) {
    const { rows } = await db.query(
      `INSERT INTO pos_documents (doc_type, doc_key, payload, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (doc_type, doc_key)
       DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
       RETURNING *`,
      [docType, docKey, payload]
    );
    return rows[0];
  },

  async findAll() {
    const { rows } = await db.query('SELECT * FROM pos_documents');
    return rows;
  },

  async findByType(docType) {
    const { rows } = await db.query(
      'SELECT * FROM pos_documents WHERE doc_type = $1 ORDER BY updated_at DESC',
      [docType]
    );
    return rows;
  },

  async remove(docType, docKey) {
    const { rowCount } = await db.query(
      'DELETE FROM pos_documents WHERE doc_type = $1 AND doc_key = $2',
      [docType, docKey]
    );
    return rowCount > 0;
  },
};

module.exports = PosDocument;
