// services/logger.js
// Zentraler Service für Activity Logging
const { pool } = require('../database');

/**
 * Loggt eine Benutzer-Aktivität in die Datenbank
 * @param {number|null} userId - User ID (null für anonyme Aktionen)
 * @param {string} actionType - Art der Aktion (LOGIN, AI_QUERY, etc.)
 * @param {object|string} details - Zusätzliche Details (wird zu JSON)
 * @param {string} ipAddress - IP-Adresse des Clients
 * @returns {Promise<void>}
 */
async function logActivity(userId, actionType, details, ipAddress) {
  try {
    // Details zu JSON-String konvertieren wenn nötig
    const detailsString = typeof details === 'object' 
      ? JSON.stringify(details) 
      : details;

    await pool.query(
      `INSERT INTO activity_logs (user_id, action_type, details, ip_address) 
       VALUES ($1, $2, $3, $4)`,
      [userId, actionType, detailsString, ipAddress]
    );

    // Optional: Log auch in Console (für Entwicklung)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📝 Log: [${actionType}] User ${userId || 'anonymous'} from ${ipAddress}`);
    }
  } catch (error) {
    // Fehler beim Logging sollten die Hauptfunktion nicht beeinträchtigen
    console.error('❌ Fehler beim Logging:', error.message);
  }
}

/**
 * Action Types - Konstanten für bessere Typ-Sicherheit
 */
const ACTION_TYPES = {
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  AI_QUERY: 'AI_QUERY',
  USER_EDIT: 'USER_EDIT',
  USER_STATUS_CHANGE: 'USER_STATUS_CHANGE',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  REGISTER: 'REGISTER'
};

module.exports = {
  logActivity,
  ACTION_TYPES
};
