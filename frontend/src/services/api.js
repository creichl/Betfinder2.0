// API Service für Backend-Kommunikation
import axios from 'axios';

// API URL - nutzt relative URL in Production (via Nginx Proxy)
// und localhost in Development
const API_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production'
    ? '/api'  // Relative URL für Production (Nginx proxy)
    : 'http://localhost:3001/api'  // Localhost für Development
);

// Axios Instance mit Basis-Konfiguration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor - fügt Token zu jedem Request hinzu
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - behandelt 401 Fehler (Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Registrierung
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Profil abrufen
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Profil aktualisieren
  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  // Passwort ändern
  changePassword: async (passwords) => {
    const response = await api.post('/auth/change-password', passwords);
    return response.data;
  }
};

// Matches API
export const matchesAPI = {
  // Alle Spiele abrufen mit optionalen Filtern
  getMatches: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.competitionId) params.append('competitionId', filters.competitionId);
    if (filters.teamId) params.append('teamId', filters.teamId);
    if (filters.status) params.append('status', filters.status);
    
    const response = await api.get(`/matches?${params.toString()}`);
    return response.data;
  },

  // Einzelnes Spiel abrufen
  getMatchById: async (id) => {
    const response = await api.get(`/matches/${id}`);
    return response.data;
  },

  // Alle Wettbewerbe abrufen
  getCompetitions: async () => {
    const response = await api.get('/matches/meta/competitions');
    return response.data;
  },

  // Historische Spiele eines Teams abrufen
  getTeamHistory: async (teamId, type, location) => {
    const params = new URLSearchParams();
    params.append('type', type);
    params.append('location', location);
    
    const response = await api.get(`/matches/team/${teamId}/history?${params.toString()}`);
    return response.data;
  }
};

// AI Chat API
export const aiChatAPI = {
  // Frage an KI senden
  askQuestion: async (question) => {
    const response = await api.post('/ai-chat', { question });
    return response.data;
  }
};

export default api;
