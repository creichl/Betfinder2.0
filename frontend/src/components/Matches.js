import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchesAPI } from '../services/api';
import './Matches.css';

const Matches = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [historyModal, setHistoryModal] = useState({ open: false, matches: [], teamName: '', statType: '', location: '' });
  
  // Filter-States
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0], // Heute
    endDate: new Date().toISOString().split('T')[0], // Heute
    competitionId: '',
    status: '',
    // Mindest-Prozentsätze für Heimteam
    homeBothScoreMin: '',
    homeNotBothScoreMin: '',
    homeOver25Min: '',
    homeUnder25Min: '',
    homeWinMin: '',
    homeDrawMin: '',
    homeLossMin: '',
    // Mindest-Prozentsätze für Auswärtsteam
    awayBothScoreMin: '',
    awayNotBothScoreMin: '',
    awayOver25Min: '',
    awayUnder25Min: '',
    awayWinMin: '',
    awayDrawMin: '',
    awayLossMin: ''
  });

  // Lade Wettbewerbe beim Start
  useEffect(() => {
    loadCompetitions();
  }, []);

  // Lade Spiele wenn sich Filter ändern
  useEffect(() => {
    loadMatches();
  }, [filters]);

  const loadCompetitions = async () => {
    try {
      const data = await matchesAPI.getCompetitions();
      setCompetitions(data);
    } catch (err) {
      console.error('Fehler beim Laden der Wettbewerbe:', err);
    }
  };

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await matchesAPI.getMatches(filters);
      setMatches(data.matches || []);
    } catch (err) {
      setError('Fehler beim Laden der Spiele: ' + err.message);
      console.error('Fehler:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      competitionId: '',
      status: '',
      homeBothScoreMin: '',
      homeNotBothScoreMin: '',
      homeOver25Min: '',
      homeUnder25Min: '',
      homeWinMin: '',
      homeDrawMin: '',
      homeLossMin: '',
      awayBothScoreMin: '',
      awayNotBothScoreMin: '',
      awayOver25Min: '',
      awayUnder25Min: '',
      awayWinMin: '',
      awayDrawMin: '',
      awayLossMin: ''
    });
  };

  // Client-seitige Filterung nach Prozentsätzen
  const filteredMatches = matches.filter(match => {
    // Heimteam-Filter
    if (filters.homeBothScoreMin && match.homeTeam.stats.bothTeamsScore < parseInt(filters.homeBothScoreMin)) return false;
    if (filters.homeNotBothScoreMin && match.homeTeam.stats.notBothTeamsScore < parseInt(filters.homeNotBothScoreMin)) return false;
    if (filters.homeOver25Min && match.homeTeam.stats.over25 < parseInt(filters.homeOver25Min)) return false;
    if (filters.homeUnder25Min && match.homeTeam.stats.under25 < parseInt(filters.homeUnder25Min)) return false;
    if (filters.homeWinMin && match.homeTeam.stats.wins < parseInt(filters.homeWinMin)) return false;
    if (filters.homeDrawMin && match.homeTeam.stats.draws < parseInt(filters.homeDrawMin)) return false;
    if (filters.homeLossMin && match.homeTeam.stats.losses < parseInt(filters.homeLossMin)) return false;
    
    // Auswärtsteam-Filter
    if (filters.awayBothScoreMin && match.awayTeam.stats.bothTeamsScore < parseInt(filters.awayBothScoreMin)) return false;
    if (filters.awayNotBothScoreMin && match.awayTeam.stats.notBothTeamsScore < parseInt(filters.awayNotBothScoreMin)) return false;
    if (filters.awayOver25Min && match.awayTeam.stats.over25 < parseInt(filters.awayOver25Min)) return false;
    if (filters.awayUnder25Min && match.awayTeam.stats.under25 < parseInt(filters.awayUnder25Min)) return false;
    if (filters.awayWinMin && match.awayTeam.stats.wins < parseInt(filters.awayWinMin)) return false;
    if (filters.awayDrawMin && match.awayTeam.stats.draws < parseInt(filters.awayDrawMin)) return false;
    if (filters.awayLossMin && match.awayTeam.stats.losses < parseInt(filters.awayLossMin)) return false;
    
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'FINISHED': { label: 'Beendet', className: 'status-finished' },
      'SCHEDULED': { label: 'Geplant', className: 'status-scheduled' },
      'LIVE': { label: 'Live', className: 'status-live' },
      'IN_PLAY': { label: 'Live', className: 'status-live' },
      'PAUSED': { label: 'Pausiert', className: 'status-paused' },
      'POSTPONED': { label: 'Verschoben', className: 'status-postponed' },
      'CANCELLED': { label: 'Abgesagt', className: 'status-cancelled' },
      'SUSPENDED': { label: 'Unterbrochen', className: 'status-suspended' }
    };
    
    const statusInfo = statusMap[status] || { label: status, className: 'status-default' };
    return <span className={`status-badge ${statusInfo.className}`}>{statusInfo.label}</span>;
  };

  const showMatchDetails = async (matchId) => {
    try {
      const match = await matchesAPI.getMatchById(matchId);
      setSelectedMatch(match);
    } catch (err) {
      console.error('Fehler beim Laden der Spieldetails:', err);
      alert('Fehler beim Laden der Spieldetails');
    }
  };

  const closeMatchDetails = () => {
    setSelectedMatch(null);
  };

  const showStatHistory = async (teamId, teamName, statType, location, event) => {
    event.stopPropagation(); // Verhindert, dass das Match-Detail-Modal öffnet
    
    try {
      const data = await matchesAPI.getTeamHistory(teamId, statType, location);
      
      const statTypeLabels = {
        'bothScore': 'Beide Teams treffen',
        'notBothScore': 'Nicht beide treffen',
        'over25': 'Über 2.5 Tore',
        'under25': 'Unter 2.5 Tore',
        'win': 'Siege',
        'draw': 'Unentschieden',
        'loss': 'Niederlagen'
      };
      
      setHistoryModal({
        open: true,
        matches: data.matches || [],
        teamName: teamName,
        statType: statTypeLabels[statType] || statType,
        location: location === 'home' ? 'Heim' : 'Auswärts'
      });
    } catch (err) {
      console.error('Fehler beim Laden der Historie:', err);
      alert('Fehler beim Laden der Historie');
    }
  };

  const closeHistoryModal = () => {
    setHistoryModal({ open: false, matches: [], teamName: '', statType: '', location: '' });
  };

  return (
    <div className="matches-container">
      <div className="matches-header">
        <button className="back-button-header" onClick={() => navigate('/dashboard')}>
          ← Zurück zum Dashboard
        </button>
        <h2>Spiele</h2>
        <p>Finde und analysiere Fußballspiele</p>
      </div>

      {/* Filter-Section */}
      <div className="filters-section">
        <h3>🔍 Filter</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Von Datum:</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Bis Datum:</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Wettbewerb:</label>
            <select
              value={filters.competitionId}
              onChange={(e) => handleFilterChange('competitionId', e.target.value)}
            >
              <option value="">Alle Wettbewerbe</option>
              {competitions.map(comp => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Alle Status</option>
              <option value="TIMED">Angesetzt</option>
              <option value="SCHEDULED">Geplant</option>
              <option value="IN_PLAY">Im Spiel</option>
              <option value="PAUSED">Pausiert</option>
              <option value="FINISHED">Beendet</option>
              <option value="AWARDED">Gewertet</option>
              <option value="POSTPONED">Verschoben</option>
              <option value="CANCELLED">Abgesagt</option>
              <option value="SUSPENDED">Unterbrochen</option>
            </select>
          </div>

          <div className="filter-actions">
            <button className="btn-reset" onClick={resetFilters}>
              ↻ Zurücksetzen
            </button>
          </div>
        </div>

        {/* Erweiterte Statistik-Filter */}
        <div className="advanced-filters">
          <h4>📊 Statistik-Filter (Mindest-%)</h4>
          
          <div className="filter-section">
            <h5>🏠 Heimteam-Statistiken</h5>
            <div className="stat-filters-grid">
              <div className="filter-group-small">
                <label>⚽⚽ Beide treffen:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={filters.homeBothScoreMin}
                  onChange={(e) => handleFilterChange('homeBothScoreMin', e.target.value)}
                />
              </div>
              <div className="filter-group-small">
                <label>❌ Nicht beide:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={filters.homeNotBothScoreMin}
                  onChange={(e) => handleFilterChange('homeNotBothScoreMin', e.target.value)}
                />
              </div>
              <div className="filter-group-small">
                <label>📈 Over 2.5:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={filters.homeOver25Min}
                  onChange={(e) => handleFilterChange('homeOver25Min', e.target.value)}
                />
              </div>
              <div className="filter-group-small">
                <label>📉 Under 2.5:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={filters.homeUnder25Min}
                  onChange={(e) => handleFilterChange('homeUnder25Min', e.target.value)}
                />
              </div>
              <div className="filter-group-small">
                <label>✅ Sieg:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={filters.homeWinMin}
                  onChange={(e) => handleFilterChange('homeWinMin', e.target.value)}
                />
              </div>
              <div className="filter-group-small">
                <label>➖ Unentschieden:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={filters.homeDrawMin}
                  onChange={(e) => handleFilterChange('homeDrawMin', e.target.value)}
                />
              </div>
              <div className="filter-group-small">
                <label>❎ Niederlage:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={filters.homeLossMin}
                  onChange={(e) => handleFilterChange('homeLossMin', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <h5>✈️ Auswärtsteam-Statistiken</h5>
            <div className="stat-filters-grid">
              <div className="filter-group-small">
                <label>⚽⚽ Beide treffen:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={filters.awayBothScoreMin}
                  onChange={(e) => handleFilterChange('awayBothScoreMin', e.target.value)}
                />
              </div>
              <div className="filter-group-small">
                <label>❌ Nicht beide:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={filters.awayNotBothScoreMin}
                  onChange={(e) => handleFilterChange('awayNotBothScoreMin', e.target.value)}
                />
              </div>
              <div className="filter-group-small">
                <label>📈 Over 2.5:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={filters.awayOver25Min}
                  onChange={(e) => handleFilterChange('awayOver25Min', e.target.value)}
                />
              </div>
              <div className="filter-group-small">
                <label>📉 Under 2.5:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={filters.awayUnder25Min}
                  onChange={(e) => handleFilterChange('awayUnder25Min', e.target.value)}
                />
              </div>
              <div className="filter-group-small">
                <label>✅ Sieg:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={filters.awayWinMin}
                  onChange={(e) => handleFilterChange('awayWinMin', e.target.value)}
                />
              </div>
              <div className="filter-group-small">
                <label>➖ Unentschieden:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={filters.awayDrawMin}
                  onChange={(e) => handleFilterChange('awayDrawMin', e.target.value)}
                />
              </div>
              <div className="filter-group-small">
                <label>❎ Niederlage:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={filters.awayLossMin}
                  onChange={(e) => handleFilterChange('awayLossMin', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ergebnisse */}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Lade Spiele...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          ⚠️ {error}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="no-results">
          <p>📭 Keine Spiele gefunden</p>
          <p className="hint">Versuche andere Filter oder Datumsbereiche</p>
        </div>
      ) : (
        <div className="matches-results">
          <div className="results-header">
            <h3>📊 {filteredMatches.length} Spiele gefunden{matches.length !== filteredMatches.length && ` (${matches.length} gesamt)`}</h3>
          </div>
          <div className="matches-list">
            {filteredMatches.map(match => (
              <div key={match.id} className="match-card" onClick={() => showMatchDetails(match.id)}>
                <div className="match-header">
                  <div className="competition-info">
                    {match.competition.emblem && (
                      <img src={match.competition.emblem} alt={match.competition.name} className="competition-emblem" />
                    )}
                    <span className="competition-name">{match.competition.name}</span>
                  </div>
                  {getStatusBadge(match.status)}
                </div>

                <div className="match-info">
                  <div className="match-date">
                    📅 {formatDate(match.utcDate)}
                  </div>
                  {match.matchday && (
                    <div className="matchday">Spieltag {match.matchday}</div>
                  )}
                </div>

                <div className="match-teams">
                  <div className="team home-team">
                    {match.homeTeam.crest && (
                      <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="team-crest" />
                    )}
                    <div className="team-info-wrapper">
                      <span className="team-name">{match.homeTeam.name}</span>
                      {match.homeTeam.stats && match.homeTeam.stats.totalGames > 0 && (
                        <div className="team-stats">
                          <span 
                            className="stat-item stat-clickable" 
                            title="Beide Mannschaften treffen (Heim)"
                            onClick={(e) => showStatHistory(match.homeTeam.id, match.homeTeam.name, 'bothScore', 'home', e)}
                          >
                            ⚽⚽ {match.homeTeam.stats.bothTeamsScore}%
                          </span>
                          <span 
                            className="stat-item stat-clickable" 
                            title="Nicht beide Mannschaften treffen (Heim)"
                            onClick={(e) => showStatHistory(match.homeTeam.id, match.homeTeam.name, 'notBothScore', 'home', e)}
                          >
                            ❌ {match.homeTeam.stats.notBothTeamsScore}%
                          </span>
                          <span 
                            className="stat-item stat-over stat-clickable" 
                            title="Über 2.5 Tore (Heim)"
                            onClick={(e) => showStatHistory(match.homeTeam.id, match.homeTeam.name, 'over25', 'home', e)}
                          >
                            📈 {match.homeTeam.stats.over25}%
                          </span>
                          <span 
                            className="stat-item stat-under stat-clickable" 
                            title="Unter 2.5 Tore (Heim)"
                            onClick={(e) => showStatHistory(match.homeTeam.id, match.homeTeam.name, 'under25', 'home', e)}
                          >
                            📉 {match.homeTeam.stats.under25}%
                          </span>
                          <span 
                            className="stat-item stat-win stat-clickable" 
                            title="Siege (Heim)"
                            onClick={(e) => showStatHistory(match.homeTeam.id, match.homeTeam.name, 'win', 'home', e)}
                          >
                            ✅ {match.homeTeam.stats.wins}%
                          </span>
                          <span 
                            className="stat-item stat-draw stat-clickable" 
                            title="Unentschieden (Heim)"
                            onClick={(e) => showStatHistory(match.homeTeam.id, match.homeTeam.name, 'draw', 'home', e)}
                          >
                            ➖ {match.homeTeam.stats.draws}%
                          </span>
                          <span 
                            className="stat-item stat-loss stat-clickable" 
                            title="Niederlagen (Heim)"
                            onClick={(e) => showStatHistory(match.homeTeam.id, match.homeTeam.name, 'loss', 'home', e)}
                          >
                            ❎ {match.homeTeam.stats.losses}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="match-score">
                    {match.score.fullTime.home !== null ? (
                      <>
                        <span className="score">{match.score.fullTime.home}</span>
                        <span className="separator">:</span>
                        <span className="score">{match.score.fullTime.away}</span>
                        {match.score.halfTime.home !== null && (
                          <span className="half-time">
                            ({match.score.halfTime.home}:{match.score.halfTime.away})
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="vs">VS</span>
                    )}
                  </div>

                  <div className="team away-team">
                    <div className="team-info-wrapper">
                      <span className="team-name">{match.awayTeam.name}</span>
                      {match.awayTeam.stats && match.awayTeam.stats.totalGames > 0 && (
                        <div className="team-stats">
                          <span 
                            className="stat-item stat-clickable" 
                            title="Beide Mannschaften treffen (Auswärts)"
                            onClick={(e) => showStatHistory(match.awayTeam.id, match.awayTeam.name, 'bothScore', 'away', e)}
                          >
                            ⚽⚽ {match.awayTeam.stats.bothTeamsScore}%
                          </span>
                          <span 
                            className="stat-item stat-clickable" 
                            title="Nicht beide Mannschaften treffen (Auswärts)"
                            onClick={(e) => showStatHistory(match.awayTeam.id, match.awayTeam.name, 'notBothScore', 'away', e)}
                          >
                            ❌ {match.awayTeam.stats.notBothTeamsScore}%
                          </span>
                          <span 
                            className="stat-item stat-over stat-clickable" 
                            title="Über 2.5 Tore (Auswärts)"
                            onClick={(e) => showStatHistory(match.awayTeam.id, match.awayTeam.name, 'over25', 'away', e)}
                          >
                            📈 {match.awayTeam.stats.over25}%
                          </span>
                          <span 
                            className="stat-item stat-under stat-clickable" 
                            title="Unter 2.5 Tore (Auswärts)"
                            onClick={(e) => showStatHistory(match.awayTeam.id, match.awayTeam.name, 'under25', 'away', e)}
                          >
                            📉 {match.awayTeam.stats.under25}%
                          </span>
                          <span 
                            className="stat-item stat-win stat-clickable" 
                            title="Siege (Auswärts)"
                            onClick={(e) => showStatHistory(match.awayTeam.id, match.awayTeam.name, 'win', 'away', e)}
                          >
                            ✅ {match.awayTeam.stats.wins}%
                          </span>
                          <span 
                            className="stat-item stat-draw stat-clickable" 
                            title="Unentschieden (Auswärts)"
                            onClick={(e) => showStatHistory(match.awayTeam.id, match.awayTeam.name, 'draw', 'away', e)}
                          >
                            ➖ {match.awayTeam.stats.draws}%
                          </span>
                          <span 
                            className="stat-item stat-loss stat-clickable" 
                            title="Niederlagen (Auswärts)"
                            onClick={(e) => showStatHistory(match.awayTeam.id, match.awayTeam.name, 'loss', 'away', e)}
                          >
                            ❎ {match.awayTeam.stats.losses}%
                          </span>
                        </div>
                      )}
                    </div>
                    {match.awayTeam.crest && (
                      <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="team-crest" />
                    )}
                  </div>
                </div>

                {match.venue && (
                  <div className="match-venue">
                    📍 {match.venue}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal für Spieldetails */}
      {selectedMatch && (
        <div className="modal-overlay" onClick={closeMatchDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeMatchDetails}>×</button>
            
            <div className="match-details">
              <div className="details-header">
                <div className="competition-header">
                  {selectedMatch.competition.emblem && (
                    <img src={selectedMatch.competition.emblem} alt={selectedMatch.competition.name} />
                  )}
                  <div>
                    <h2>{selectedMatch.competition.name}</h2>
                    <p>{selectedMatch.area.name}</p>
                  </div>
                </div>
                {getStatusBadge(selectedMatch.status)}
              </div>

              <div className="details-match">
                <div className="detail-team">
                  {selectedMatch.homeTeam.crest && (
                    <img src={selectedMatch.homeTeam.crest} alt={selectedMatch.homeTeam.name} className="detail-crest" />
                  )}
                  <h3>{selectedMatch.homeTeam.name}</h3>
                  {selectedMatch.homeTeam.founded && (
                    <p className="team-info">Gegründet: {selectedMatch.homeTeam.founded}</p>
                  )}
                  {selectedMatch.homeTeam.venue && (
                    <p className="team-info">Stadion: {selectedMatch.homeTeam.venue}</p>
                  )}
                </div>

                <div className="detail-score">
                  {selectedMatch.score.fullTime.home !== null ? (
                    <>
                      <div className="score-main">
                        <span>{selectedMatch.score.fullTime.home}</span>
                        <span>:</span>
                        <span>{selectedMatch.score.fullTime.away}</span>
                      </div>
                      {selectedMatch.score.halfTime.home !== null && (
                        <div className="score-half">
                          Halbzeit: {selectedMatch.score.halfTime.home}:{selectedMatch.score.halfTime.away}
                        </div>
                      )}
                      {selectedMatch.score.extraTime && (
                        <div className="score-extra">
                          Verlängerung: {selectedMatch.score.extraTime.home}:{selectedMatch.score.extraTime.away}
                        </div>
                      )}
                      {selectedMatch.score.penalties && (
                        <div className="score-penalties">
                          Elfmeterschießen: {selectedMatch.score.penalties.home}:{selectedMatch.score.penalties.away}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="score-scheduled">
                      <p>Anstoß:</p>
                      <p className="kickoff-time">{formatDate(selectedMatch.utcDate)}</p>
                    </div>
                  )}
                </div>

                <div className="detail-team">
                  {selectedMatch.awayTeam.crest && (
                    <img src={selectedMatch.awayTeam.crest} alt={selectedMatch.awayTeam.name} className="detail-crest" />
                  )}
                  <h3>{selectedMatch.awayTeam.name}</h3>
                  {selectedMatch.awayTeam.founded && (
                    <p className="team-info">Gegründet: {selectedMatch.awayTeam.founded}</p>
                  )}
                  {selectedMatch.awayTeam.venue && (
                    <p className="team-info">Stadion: {selectedMatch.awayTeam.venue}</p>
                  )}
                </div>
              </div>

              <div className="details-info">
                <div className="info-grid">
                  {selectedMatch.venue && (
                    <div className="info-item">
                      <strong>📍 Spielort:</strong>
                      <span>{selectedMatch.venue}</span>
                    </div>
                  )}
                  {selectedMatch.matchday && (
                    <div className="info-item">
                      <strong>📅 Spieltag:</strong>
                      <span>{selectedMatch.matchday}</span>
                    </div>
                  )}
                  {selectedMatch.stage && (
                    <div className="info-item">
                      <strong>🏆 Phase:</strong>
                      <span>{selectedMatch.stage}</span>
                    </div>
                  )}
                  {selectedMatch.attendance && (
                    <div className="info-item">
                      <strong>👥 Zuschauer:</strong>
                      <span>{selectedMatch.attendance.toLocaleString('de-DE')}</span>
                    </div>
                  )}
                </div>

                {selectedMatch.referee && (
                  <div className="referees-section">
                    <h4>👔 Schiedsrichter</h4>
                    <ul>
                      <li>
                        <strong>Hauptschiedsrichter:</strong> {selectedMatch.referee.name} 
                        {selectedMatch.referee.nationality && ` (${selectedMatch.referee.nationality})`}
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal.open && (
        <div className="modal-overlay" onClick={closeHistoryModal}>
          <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeHistoryModal}>×</button>
            
            <div className="history-content">
              <div className="history-header">
                <h2>{historyModal.teamName}</h2>
                <p className="history-subtitle">{historyModal.statType} - {historyModal.location}spiele</p>
                <p className="history-count">📊 {historyModal.matches.length} Spiele gefunden (max. 20)</p>
              </div>

              <div className="history-matches">
                {historyModal.matches.length === 0 ? (
                  <div className="no-history">
                    <p>Keine historischen Spiele gefunden</p>
                  </div>
                ) : (
                  historyModal.matches.map((match, index) => (
                    <div key={match.id || index} className="history-match-item">
                      <div className="history-match-header">
                        {match.competition.emblem && (
                          <img src={match.competition.emblem} alt={match.competition.name} className="history-emblem" />
                        )}
                        <span className="history-competition">{match.competition.name}</span>
                        <span className="history-date">{formatShortDate(match.utcDate)}</span>
                      </div>
                      <div className="history-match-score">
                        <span className="history-team">{match.homeTeam}</span>
                        <span className="history-result">
                          {match.score.home} : {match.score.away}
                        </span>
                        <span className="history-team">{match.awayTeam}</span>
                      </div>
                      {match.venue && (
                        <div className="history-venue">📍 {match.venue}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matches;
