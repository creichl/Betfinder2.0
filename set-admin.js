// set-admin.js - Script um einen User zum Admin zu machen
const { pool } = require('./database');

async function setAdmin() {
  try {
    // HIER DEINE EMAIL EINTRAGEN:
    const email = 'c.reichl@outlook.com';  // <-- ÄNDERN!
    
    console.log(`\n🔍 Suche User mit Email: ${email}...\n`);
    
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, username, email, role, status',
      ['admin', email]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Admin-Rolle erfolgreich gesetzt!\n');
      console.log('User-Details:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rolle: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log('\n💡 Bitte einloggen um Admin-Funktionen zu sehen!');
    } else {
      console.log(`❌ User nicht gefunden mit Email: ${email}`);
      console.log('\n📋 Verfügbare User:');
      
      const allUsers = await pool.query(
        'SELECT id, username, email, role FROM users ORDER BY id'
      );
      
      allUsers.rows.forEach(u => {
        console.log(`   - ${u.email} (${u.username}) - Rolle: ${u.role}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
}

setAdmin();
