const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigrations() {
  const dir = __dirname;
  const files = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  try {
    await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    )`);

    for (const file of files) {
      const { rowCount } = await db.query(
        'SELECT 1 FROM schema_migrations WHERE name = $1',
        [file]
      );
      if (rowCount > 0) {
        console.log(`Skip ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      await db.query(sql);
      await db.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      console.log(`Migration ${file} applied successfully`);
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }

  await db.pool.end();
}

runMigrations();
