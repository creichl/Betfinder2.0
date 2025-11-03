// init-users-table.js - Erstellt die Users-Tabelle
const pool = require('./database');

async function initUsersTable() {
  try {
    console.log('👤 Erstelle Users-Tabelle...\n');

    // Users Tabelle
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );
    `);
    console.log('✅ Tabelle "users" erstellt');

    // User Preferences Tabelle (optional für Zukunft)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        favorite_teams INTEGER[],
        favorite_competitions INTEGER[],
        notification_settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `);
    console.log('✅ Tabelle "user_preferences" erstellt');

    // Indizes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`);
    console.log('✅ Indizes erstellt');

    console.log('\n🎉 Users-Schema erfolgreich erstellt!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fehler beim Initialisieren:', error.message);
    console.error(error);
    process.exit(1);
  }
}

initUsersTable();
