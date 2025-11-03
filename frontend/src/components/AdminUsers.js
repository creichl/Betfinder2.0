// AdminUsers.js - User-Verwaltung für Admins
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import './Admin.css';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadUsers();
  }, [page, search, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUsers({
        page,
        limit: 20,
        search,
        status: statusFilter
      });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Fehler beim Laden der User:', error);
      alert('Fehler beim Laden der User');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      status: user.status
    });
  };

  const handleSaveEdit = async () => {
    try {
      await adminAPI.updateUser(editingUser.id, editForm);
      alert('User erfolgreich aktualisiert');
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Fehler beim Aktualisieren: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeactivate = async (user) => {
    if (!window.confirm(`User "${user.username}" wirklich deaktivieren?`)) {
      return;
    }
    
    try {
      await adminAPI.deactivateUser(user.id);
      alert('User erfolgreich deaktiviert');
      loadUsers();
    } catch (error) {
      console.error('Fehler beim Deaktivieren:', error);
      alert('Fehler beim Deaktivieren: ' + (error.response?.data?.error || error.message));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nie';
    return new Date(dateString).toLocaleString('de-DE');
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          ← Zurück zum Dashboard
        </button>
        <h1>👥 User-Verwaltung</h1>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Suche nach Name, Email, Username..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="search-input"
        />
        
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="filter-select"
        >
          <option value="all">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="inactive">Inaktiv</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Lade User...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Rolle</th>
                  <th>Status</th>
                  <th>Registriert</th>
                  <th>Letzter Login</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>
                      <span className={`badge badge-${user.role}`}>
                        {user.role === 'admin' ? '🔐 Admin' : '👤 User'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${user.status}`}>
                        {user.status === 'active' ? '✅ Aktiv' : '❌ Inaktiv'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{formatDate(user.lastLogin)}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(user)}
                      >
                        ✏️ Bearbeiten
                      </button>
                      {user.status === 'active' && (
                        <button
                          className="btn-deactivate"
                          onClick={() => handleDeactivate(user)}
                        >
                          🚫 Deaktivieren
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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
                ({pagination.total} User gesamt)
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

      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>✏️ User bearbeiten</h2>
            
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Vorname</label>
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Nachname</label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Rolle</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({...editForm, role: e.target.value})}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({...editForm, status: e.target.value})}
              >
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditingUser(null)}>
                Abbrechen
              </button>
              <button className="btn-save" onClick={handleSaveEdit}>
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
