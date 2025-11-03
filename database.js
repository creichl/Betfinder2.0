// database.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'betfinder',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  // UTF-8 Encoding direkt im Connection String
  client_encoding: 'UTF8',
  options: '-c client_encoding=UTF8'
});

// Connection Event Handler
pool.on('connect', (client) => {
  console.log('✅ Mit Datenbank verbunden');
});

pool.on('error', (err) => {
  console.error('❌ Datenbank-Fehler:', err);
  process.exit(-1);
});

module.exports = { pool };
