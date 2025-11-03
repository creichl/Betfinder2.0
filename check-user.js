// check-user.js - Prüfe User-Status
require('dotenv').config();
const { pool } = require('./database');
const bcrypt = require('bcryptjs');

const email = 'nedzad.ramic.at@gmail.com';
const testPassword = 'BEtfinder2025';

async function checkUser() {
  try {
    console.log('\n🔍 Prüfe User:', email);
    console.log('━'.repeat(50));

    // Suche User
    const result = await pool.query(
      'SELECT id, username, email, is_active, status, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ User nicht gefunden!');
      console.log('\n💡 Lösung: User muss über die Admin-UI erstellt werden');
      process.exit(0);
    }

    const user = result.rows[0];
    console.log('✅ User gefunden:');
    console.log('   ID:', user.id);
    console.log('   Username:', user.username);
    console.log('   Email:', user.email);
    console.log('   is_active:', user.is_active);
    console.log('   status:', user.status);

    // Prüfe Status
    if (!user.is_active) {
      console.log('\n❌ Problem: User ist nicht aktiv (is_active = false)');
      console.log('💡 Lösung: In Admin-UI den User aktivieren');
    }

    if (user.status && user.status !== 'active') {
      console.log('\n❌ Problem: User-Status ist nicht "active":', user.status);
      console.log('💡 Lösung: In Admin-UI den Status auf "active" setzen');
    }

    // Prüfe Passwort
    console.log('\n🔐 Prüfe Passwort...');
    const validPassword = await bcrypt.compare(testPassword, user.password_hash);
    
    if (validPassword) {
      console.log('✅ Passwort stimmt überein!');
    } else {
      console.log('❌ Passwort stimmt NICHT überein!');
      console.log('💡 Lösung: Passwort zurücksetzen (siehe reset-password.js)');
    }

    console.log('\n' + '━'.repeat(50));
    
    if (user.is_active && validPassword) {
      console.log('✅ User sollte sich einloggen können!');
    } else {
      console.log('❌ User kann sich NICHT einloggen');
      console.log('\nProbleme:');
      if (!user.is_active) console.log('  - is_active = false');
      if (user.status !== 'active') console.log('  - status =', user.status);
      if (!validPassword) console.log('  - Passwort falsch');
    }

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Fehler:', error);
    process.exit(1);
  }
}

checkUser();
