import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { statsAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await statsAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nie';
    return new Date(dateString).toLocaleString('de-DE');
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-content">
          <h1>Betfinder 2.0</h1>
          <div className="navbar-actions">
            <button 
              className="btn-secondary" 
              onClick={() => navigate('/profile')}
            >
              Profil
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              Abmelden
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Willkommen, {user?.firstName || user?.username}! 👋</h2>
          <p className="welcome-text">
            Schön, dass du da bist. Hier ist dein Dashboard für Betfinder 2.0.
          </p>
        </div>

        <div className="cards-grid">
          <div className="info-card">
            <div className="card-icon">👤</div>
            <h3>Dein Profil</h3>
            <div className="card-details">
              <p><strong>Benutzername:</strong> {user?.username}</p>
              <p><strong>E-Mail:</strong> {user?.email}</p>
              <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
              <p><strong>Rolle:</strong> {user?.role}</p>
              <p><strong>Registriert seit:</strong> {formatDate(user?.createdAt)}</p>
              <p><strong>Letzter Login:</strong> {formatDate(user?.lastLogin)}</p>
            </div>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/profile')}
            >
              Profil bearbeiten
            </button>
          </div>

          <div className="info-card">
            <div className="card-icon">📊</div>
            <h3>Datenbank-Statistiken</h3>
            <div className="card-details">
              {loadingStats ? (
                <p>Lade Statistiken...</p>
              ) : stats ? (
                <>
                  <p><strong>Wettbewerbe:</strong> {stats.competitions.toLocaleString('de-DE')}</p>
                  <p><strong>Teams:</strong> {stats.teams.toLocaleString('de-DE')}</p>
                  <p><strong>Seasons:</strong> {stats.seasons.toLocaleString('de-DE')}</p>
                  <p><strong>Spiele:</strong> {stats.matches.toLocaleString('de-DE')}</p>
                  <p><strong>Spieler:</strong> {stats.players.toLocaleString('de-DE')}</p>
                </>
              ) : (
                <p>Fehler beim Laden</p>
              )}
            </div>
          </div>

          <div className="info-card">
            <div className="card-icon">⚡</div>
            <h3>Quick Actions</h3>
            <div className="card-details">
              <button className="btn-action" onClick={() => navigate('/matches')}>🔍 Spiele suchen</button>
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="info-card admin-card">
              <div className="card-icon">🔐</div>
              <h3>Admin-Bereich</h3>
              <div className="card-details">
                <button className="btn-action" onClick={() => navigate('/admin/users')}>👥 User-Verwaltung</button>
                <button className="btn-action" onClick={() => navigate('/admin/logs')}>📋 Activity Logs</button>
              </div>
            </div>
          )}
        </div>

        <footer className="dashboard-footer">
          <Link to="/impressum">Impressum</Link>
          <span className="separator">•</span>
          <Link to="/datenschutz">Datenschutz</Link>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
