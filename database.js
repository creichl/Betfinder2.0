// database.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'betfinder',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432
});

// UTF-8 Encoding bei jeder neuen Connection setzen
pool.on('connect', (client) => {
  client.query('SET CLIENT_ENCODING TO UTF8');
  console.log('✅ Mit Datenbank verbunden (UTF-8)');
});

pool.on('error', (err) => {
  console.error('❌ Datenbank-Fehler:', err);
  process.exit(-1);
});

module.exports = { pool };
