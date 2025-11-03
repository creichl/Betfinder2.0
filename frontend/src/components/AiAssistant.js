import React, { useState } from 'react';
import { aiChatAPI, matchesAPI } from '../services/api';
import './AiAssistant.css';

const AiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const suggestedQuestions = [
    'Spiele heute',
    'Bayern München',
    'Champions League diese Woche',
    'Bundesliga Spiele'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userQuestion = question.trim();
    setQuestion('');
    
    // Füge User-Message hinzu
    const userMessage = {
      role: 'user',
      content: userQuestion,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await aiChatAPI.askQuestion(userQuestion);
      
      // Füge Bot-Response hinzu
      const botMessage = {
        role: 'assistant',
        content: response.message,
        matches: response.matches || [],
        type: response.type,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Fehler:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: error.response?.data?.message || 'Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.',
        type: 'error',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuestion(suggestion);
  };

  const showMatchDetails = async (matchId) => {
    try {
      const match = await matchesAPI.getMatchById(matchId);
      setSelectedMatch(match);
    } catch (err) {
      console.error('Fehler beim Laden der Spieldetails:', err);
    }
  };

  const closeMatchDetails = () => {
    setSelectedMatch(null);
  };

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

  const renderMatchCard = (match) => (
    <div key={match.id} className="ai-match-card" onClick={() => showMatchDetails(match.id)}>
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
            {match.homeTeam.stats && match.homeTeam.stats.total_games > 0 && (
              <div className="team-stats">
                <span className="stat-item" title="Beide Mannschaften treffen (Heim)">
                  ⚽⚽ {match.homeTeam.stats.both_teams_score}%
                </span>
                <span className="stat-item" title="Nicht beide Mannschaften treffen (Heim)">
                  ❌ {match.homeTeam.stats.not_both_teams_score}%
                </span>
                <span className="stat-item stat-over" title="Über 2.5 Tore (Heim)">
                  📈 {match.homeTeam.stats.over_25}%
                </span>
                <span className="stat-item stat-under" title="Unter 2.5 Tore (Heim)">
                  📉 {match.homeTeam.stats.under_25}%
                </span>
                <span className="stat-item stat-win" title="Siege (Heim)">
                  ✅ {match.homeTeam.stats.wins}%
                </span>
                <span className="stat-item stat-draw" title="Unentschieden (Heim)">
                  ➖ {match.homeTeam.stats.draws}%
                </span>
                <span className="stat-item stat-loss" title="Niederlagen (Heim)">
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
            {match.awayTeam.stats && match.awayTeam.stats.total_games > 0 && (
              <div className="team-stats">
                <span className="stat-item" title="Beide Mannschaften treffen (Auswärts)">
                  ⚽⚽ {match.awayTeam.stats.both_teams_score}%
                </span>
                <span className="stat-item" title="Nicht beide Mannschaften treffen (Auswärts)">
                  ❌ {match.awayTeam.stats.not_both_teams_score}%
                </span>
                <span className="stat-item stat-over" title="Über 2.5 Tore (Auswärts)">
                  📈 {match.awayTeam.stats.over_25}%
                </span>
                <span className="stat-item stat-under" title="Unter 2.5 Tore (Auswärts)">
                  📉 {match.awayTeam.stats.under_25}%
                </span>
                <span className="stat-item stat-win" title="Siege (Auswärts)">
                  ✅ {match.awayTeam.stats.wins}%
                </span>
                <span className="stat-item stat-draw" title="Unentschieden (Auswärts)">
                  ➖ {match.awayTeam.stats.draws}%
                </span>
                <span className="stat-item stat-loss" title="Niederlagen (Auswärts)">
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
  );

  return (
    <>
      {/* Floating Button */}
      <button className="ai-floating-button" onClick={() => setIsOpen(true)} title="KI-Assistent öffnen">
        <span className="ai-icon">💬</span>
        <span className="ai-label">Frag mich</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="ai-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <h2>⚽ Betfinder 2.0</h2>
              <button className="ai-close-button" onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div className="ai-chat-container">
              {messages.length === 0 ? (
                <div className="ai-welcome">
                  <div className="ai-welcome-icon">⚽</div>
                  <h3>Willkommen!</h3>
                  <p>Stelle mir Fragen über Fußballspiele</p>
                  <div className="ai-suggestions">
                    <p><strong>💡 Vorschläge:</strong></p>
                    {suggestedQuestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="ai-suggestion-btn"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="ai-messages">
                  {messages.map((message, index) => (
                    <div key={index} className={`ai-message ai-message-${message.role}`}>
                      {message.role === 'user' ? (
                        <div className="ai-message-content">
                          <div className="ai-message-text">{message.content}</div>
                        </div>
                      ) : (
                        <div className="ai-message-content">
                          <div className="ai-message-text">{message.content}</div>
                          {message.matches && message.matches.length > 0 && (
                            <div className="ai-matches-list">
                              {message.matches.map(match => renderMatchCard(match))}
                            </div>
                          )}
                          {message.type === 'error' && (
                            <div className="ai-error-hint">
                              💡 Versuche Fragen wie: "Spiele heute" oder "Bayern München"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="ai-message ai-message-assistant">
                      <div className="ai-message-content">
                        <div className="ai-typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form className="ai-input-form" onSubmit={handleSubmit}>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Frag etwas über Fußballspiele..."
                disabled={loading}
                className="ai-input"
              />
              <button type="submit" disabled={loading || !question.trim()} className="ai-send-button">
                {loading ? '⏳' : '→'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Match Details Modal */}
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
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiAssistant;
