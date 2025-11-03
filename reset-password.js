// reset-password.js - Setze Passwort für einen User zurück
require('dotenv').config();
const { pool } = require('./database');
const bcrypt = require('bcryptjs');

// HIER ANPASSEN:
const email = 'nedzad.ramic.at@gmail.com';
const newPassword = 'Betfinder2025';

async function resetPassword() {
  try {
    console.log('\n🔐 Setze Passwort zurück für:', email);
    console.log('━'.repeat(50));

    // Finde User
    const result = await pool.query(
      'SELECT id, username FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ User nicht gefunden!');
      await pool.end();
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('✅ User gefunden:', user.username);

    // Hash neues Passwort
    console.log('\n🔄 Hashe neues Passwort...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update Passwort
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, user.id]
    );

    console.log('✅ Passwort erfolgreich zurückgesetzt!');
    console.log('\n📋 Login-Daten:');
    console.log('   Email/Username:', email);
    console.log('   Passwort:', newPassword);
    console.log('\n💡 Der User kann sich jetzt einloggen!');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Fehler:', error);
    process.exit(1);
  }
}

resetPassword();
