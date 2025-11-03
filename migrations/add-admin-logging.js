// migrations/add-admin-logging.js
// Fügt Admin-Funktionalität und Logging zur Datenbank hinzu
const { pool } = require('../database');

async function runMigration() {
  try {
    console.log('🔄 Starte Admin & Logging Migration...\n');

    // 1. Activity Logs Tabelle erstellen
    console.log('📝 Erstelle activity_logs Tabelle...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action_type VARCHAR(50) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ activity_logs Tabelle erstellt');

    // 2. Users Tabelle erweitern
    console.log('\n📝 Erweitere users Tabelle...');
    
    // Status-Spalte hinzufügen (falls nicht vorhanden)
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
    `);
    console.log('✅ Status-Spalte hinzugefügt');

    // 3. Indizes für Performance erstellen
    console.log('\n📈 Erstelle Performance-Indizes...');
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_user_id 
      ON activity_logs(user_id);
    `);
    console.log('✅ Index auf user_id erstellt');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_action_type 
      ON activity_logs(action_type);
    `);
    console.log('✅ Index auf action_type erstellt');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_created_at 
      ON activity_logs(created_at DESC);
    `);
    console.log('✅ Index auf created_at erstellt');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_logs_ip_address 
      ON activity_logs(ip_address);
    `);
    console.log('✅ Index auf ip_address erstellt');

    // 4. Übersicht der Action Types
    console.log('\n📋 Verfügbare Action Types:');
    console.log('   - LOGIN: User-Login');
    console.log('   - LOGIN_FAILED: Fehlgeschlagener Login');
    console.log('   - LOGOUT: User-Logout');
    console.log('   - AI_QUERY: Frage an KI-Bot');
    console.log('   - USER_EDIT: Admin bearbeitet User');
    console.log('   - USER_STATUS_CHANGE: User aktiviert/deaktiviert');
    console.log('   - PROFILE_UPDATE: User ändert eigenes Profil');
    console.log('   - PASSWORD_CHANGE: Passwort geändert');

    console.log('\n🎉 Migration erfolgreich abgeschlossen!');
    console.log('\n💡 Hinweis: Um einen User zum Admin zu machen:');
    console.log('   UPDATE users SET role = \'admin\' WHERE email = \'deine@email.de\';');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fehler bei der Migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
