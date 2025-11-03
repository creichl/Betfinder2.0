// AdminLogs.js - Activity Logs für Admins
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import './Admin.css';

const AdminLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter, startDate, endDate]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const filters = {
        page,
        limit: 50,
        actionType: actionFilter
      };
      
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      const data = await adminAPI.getLogs(filters);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Fehler beim Laden der Logs:', error);
      alert('Fehler beim Laden der Logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  const getActionBadge = (actionType) => {
    const badges = {
      'LOGIN': { emoji: '✅', color: 'green', text: 'Login' },
      'LOGIN_FAILED': { emoji: '❌', color: 'red', text: 'Login fehlgeschlagen' },
      'LOGOUT': { emoji: '👋', color: 'gray', text: 'Logout' },
      'REGISTER': { emoji: '📝', color: 'blue', text: 'Registrierung' },
      'AI_QUERY': { emoji: '🤖', color: 'purple', text: 'KI-Anfrage' },
      'USER_EDIT': { emoji: '✏️', color: 'orange', text: 'User bearbeitet' },
      'USER_STATUS_CHANGE': { emoji: '🔄', color: 'orange', text: 'Status geändert' },
      'PROFILE_UPDATE': { emoji: '👤', color: 'blue', text: 'Profil aktualisiert' },
      'PASSWORD_CHANGE': { emoji: '🔒', color: 'purple', text: 'Passwort geändert' }
    };
    
    const badge = badges[actionType] || { emoji: '📋', color: 'gray', text: actionType };
    return badge;
  };

  const exportToCSV = () => {
    const csvContent = [
      ['ID', 'Zeitpunkt', 'User', 'Email', 'Aktion', 'Details', 'IP-Adresse'].join(','),
      ...logs.map(log => [
        log.id,
        formatDate(log.created_at),
        log.username || 'Anonym',
        log.email || '-',
        log.action_type,
        `"${log.details || ''}"`,
        log.ip_address
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          ← Zurück zum Dashboard
        </button>
        <h1>📋 Activity Logs</h1>
        <button className="btn-export" onClick={exportToCSV}>
          📥 Als CSV exportieren
        </button>
      </div>

      <div className="admin-filters">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="filter-select"
        >
          <option value="all">Alle Aktionen</option>
          <option value="LOGIN">✅ Login</option>
          <option value="LOGIN_FAILED">❌ Login fehlgeschlagen</option>
          <option value="REGISTER">📝 Registrierung</option>
          <option value="AI_QUERY">🤖 KI-Anfrage</option>
          <option value="USER_EDIT">✏️ User bearbeitet</option>
          <option value="USER_STATUS_CHANGE">🔄 Status geändert</option>
          <option value="PROFILE_UPDATE">👤 Profil aktualisiert</option>
          <option value="PASSWORD_CHANGE">🔒 Passwort geändert</option>
        </select>

        <div className="date-filters">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="date-input"
            placeholder="Von"
          />
          <span>bis</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="date-input"
            placeholder="Bis"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Lade Logs...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="admin-table logs-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Zeitpunkt</th>
                  <th>User</th>
                  <th>Aktion</th>
                  <th>Details</th>
                  <th>IP-Adresse</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const badge = getActionBadge(log.action_type);
                  return (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td>{formatDate(log.created_at)}</td>
                      <td>
                        {log.username ? (
                          <>
                            <strong>{log.username}</strong>
                            <br />
                            <small>{log.email}</small>
                          </>
                        ) : (
                          <span className="anonymous">Anonym</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${badge.color}`}>
                          {badge.emoji} {badge.text}
                        </span>
                      </td>
                      <td className="details-cell">
                        {log.details || '-'}
                      </td>
                      <td>
                        <code>{log.ip_address}</code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="btn-pagination"
              >
                ← Vorherige
              </button>
              <span className="pagination-info">
                Seite {page} von {pagination.totalPages} 
                ({pagination.total} Logs gesamt)
              </span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="btn-pagination"
              >
                Nächste →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminLogs;
