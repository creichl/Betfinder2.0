// database.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'betfinder',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
  console.log('✅ Mit Datenbank verbunden');
});

pool.on('error', (err) => {
  console.error('❌ Datenbank-Fehler:', err);
  process.exit(-1);
});

module.exports = { pool };
