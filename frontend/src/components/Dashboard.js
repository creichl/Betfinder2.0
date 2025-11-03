import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nie';
    return new Date(dateString).toLocaleString('de-DE');
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-content">
          <h1>⚽ Fußball Analyzer</h1>
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
            Schön, dass du da bist. Hier ist dein Dashboard für die Fußball-Analyzer App.
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
            <h3>Statistiken</h3>
            <div className="card-details">
              <p><strong>Registriert seit:</strong></p>
              <p>{formatDate(user?.createdAt)}</p>
              <p><strong>Letzter Login:</strong></p>
              <p>{formatDate(user?.lastLogin)}</p>
            </div>
          </div>

          <div className="info-card">
            <div className="card-icon">⚡</div>
            <h3>Quick Actions</h3>
            <div className="card-details">
              <button className="btn-action" onClick={() => navigate('/matches')}>🔍 Spiele suchen</button>
            </div>
          </div>

          <div className="info-card feature-preview">
            <div className="card-icon">🚀</div>
            <h3>Coming Soon</h3>
            <div className="card-details">
              <p>• Live-Spielstände</p>
              <p>• Detaillierte Analysen</p>
              <p>• Wett-Tipps</p>
              <p>• Mannschaftsvergleiche</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
