const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigrations() {
  const sql = fs.readFileSync(
    path.join(__dirname, '001_initial.sql'),
    'utf8'
  );

  try {
    await db.query(sql);
    console.log('Migration 001_initial applied successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }

  await db.pool.end();
}

runMigrations();
