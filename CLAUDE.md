# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BetFinder 2.0 is a football (soccer) match analysis platform with AI-powered search capabilities. The application consists of:
- **Backend**: Node.js/Express REST API with PostgreSQL database
- **Frontend**: React SPA with React Router
- **AI Integration**: Anthropic Claude API for natural language match queries
- **Data Source**: football-data.org API (Tier Four subscription - 500 requests/minute)

## Tech Stack

### Backend
- Express 5.1.0 (CommonJS)
- PostgreSQL database via `pg` package
- JWT authentication with bcryptjs
- Anthropic SDK for AI chat features
- express-validator for input validation

### Frontend
- React 19.2.0
- react-router-dom 7.9.5
- Axios for API calls
- Create React App setup

## Development Commands

### Initial Setup
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Set up database (PostgreSQL must be running)
node init-database.js
node init-users-table.js

# Import initial football data (60-180 minutes, 2000-5000 API requests)
node import-all-data.js
```

### Running the Application
```bash
# Start backend server (port 3001)
node server.js

# Start frontend dev server (port 3000, in separate terminal)
cd frontend
npm start
```

### Data Management

The application uses two data scripts with different purposes:

**Full Import** (use rarely):
```bash
node import-all-data.js
# Duration: 60-180 minutes
# API requests: 2000-5000
# Use for: Initial setup or complete data refresh
```

**Incremental Updates** (use frequently):
```bash
# Daily update - last 7 days + next 14 days (default)
node update-data.js recent
# or simply: node update-data.js

# Live updates during match days - only running/scheduled matches
node update-data.js live

# Today's matches only
node update-data.js today

# This week - last 3 days + next 7 days
node update-data.js week

# Full season with standings and top scorers
node update-data.js season

# Smart mode - only outdated matches
node update-data.js smart
```

See UPDATE-GUIDE.md for detailed information about update modes and automation strategies.

## Architecture

### Backend Structure

**Server Entry Point**: `server.js`
- Initializes Express app on port 3001
- Configures CORS and JSON middleware
- Mounts three route modules

**Routes** (in `routes/` directory):
- `auth.js`: User registration, login, profile management, password changes
- `matches.js`: Match listings with filters, detailed match data, team statistics, competition metadata
- `ai-chat.js`: Natural language match search using Claude API

**Middleware**: `middleware/auth.js`
- `authenticateToken`: JWT verification middleware (validates Bearer tokens)
- `requireAdmin`: Admin role check (currently unused)
- All API endpoints except auth registration/login require authentication

**Database**: `database.js`
- PostgreSQL connection pool configuration
- Connects to `betfinder` database on localhost:5432

### Frontend Structure

**Entry Point**: `frontend/src/App.js`
- React Router setup with protected routes
- AI Assistant component shown on all authenticated pages
- Public routes: `/login`, `/register`
- Protected routes: `/dashboard`, `/profile`, `/matches`

**Key Components**:
- `Login.js` / `Register.js`: Authentication forms
- `Dashboard.js`: Main landing page after login
- `Matches.js`: Match browsing with filters and statistics
- `Profile.js`: User profile management
- `AiAssistant.js`: Floating AI chat interface for natural language match queries
- `ProtectedRoute.js`: Route guard component

**Context**: `AuthContext.js`
- Global authentication state management
- Token storage in localStorage
- User profile data and login/logout functions

**API Service**: `frontend/src/services/api.js`
- Axios instance with base URL configuration
- Automatic JWT token injection for authenticated requests

### Database Schema

**Core Tables**:
- `users`: id, username, email, password_hash, first_name, last_name, role, is_active, created_at, last_login
- `competitions`: id, name, code, type, emblem, area_name, area_code, current_season_id
- `teams`: id, name, short_name, tla, crest, address, website, founded, club_colors, venue, area_name
- `matches`: id, competition_id, home_team_id, away_team_id, utc_date, status, matchday, stage, group_name, winner, full_time_home, full_time_away, half_time_home, half_time_away, venue, referee_name, season_start_date, last_updated
- `standings`: competition_id, season_id, stage, type, team_id, position, points, wins, draws, losses, goals_for, goals_against
- `top_scorers`: competition_id, season_id, player_id, player_name, team_id, team_name, goals, assists, penalties

### Authentication Flow

1. User registers via POST `/api/auth/register` or logs in via POST `/api/auth/login`
2. Backend validates credentials using bcryptjs, returns JWT token (7-day expiration)
3. Frontend stores token in localStorage via AuthContext
4. All subsequent API requests include `Authorization: Bearer <token>` header
5. Backend `authenticateToken` middleware verifies JWT and attaches `req.user` with userId, username, email, role

### AI Chat Feature

The AI Assistant (`/api/ai-chat`) allows users to search for matches using natural language:

**How it works**:
1. User submits natural language query (e.g., "Bayern games today", "Champions League this week")
2. Backend sends query to Claude API with specialized system prompt containing database schema
3. Claude generates safe SQL SELECT query with explanation
4. Backend validates SQL (blocks dangerous operations, enforces LIMIT, allows only specific tables)
5. Query executes with 5-second timeout
6. Results enriched with team statistics (both-teams-score, over/under 2.5, win/draw/loss percentages)
7. Frontend displays matches with stats in user-friendly format

**Security**: SQL validation in `routes/ai-chat.js:validateSQL()` prevents injection attacks by blocking DROP, DELETE, UPDATE, INSERT, ALTER, etc.

## Environment Variables

Required in `.env` file (root directory):
```
FOOTBALL_API_KEY=<football-data.org API key>
DB_USER=postgres
DB_HOST=localhost
DB_NAME=betfinder
DB_PASSWORD=<your-postgres-password>
DB_PORT=5432
JWT_SECRET=<your-secret-key>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

**Important**: Never commit `.env` file. Add to `.gitignore`.

## Rate Limiting

The football-data.org API has Tier Four access (500 requests/minute). Both `import-all-data.js` and `update-data.js` implement:
- Request counting per minute window
- Automatic waiting when approaching limit
- Exponential backoff for 429 responses
- Retry logic for transient failures (up to 3 attempts for network errors, 5 for rate limits)

## Common Development Patterns

### Adding a New API Endpoint

1. Create route handler in appropriate file (`routes/auth.js`, `routes/matches.js`, or new file)
2. Add authentication middleware if needed: `router.get('/path', authenticateToken, async (req, res) => { ... })`
3. Use express-validator for input validation
4. Query database via `pool.query(sql, params)` using parameterized queries (always use `$1, $2` placeholders)
5. Handle errors with try-catch and return appropriate HTTP status codes
6. Mount new route file in `server.js` if creating new module

### Working with Match Statistics

The `/api/matches` endpoint computes statistics for each team by querying historical matches:
- Home team stats: Only home games (WHERE home_team_id = ?)
- Away team stats: Only away games (WHERE away_team_id = ?)
- Stats calculated: both-teams-score %, over/under 2.5 goals %, win/draw/loss %
- Only FINISHED matches with non-null scores included

When adding features that display matches, consider whether to include these statistics or fetch match data without the expensive stats queries.

### Frontend API Calls

Use the configured axios instance from `api.js`:
```javascript
import api from '../services/api';

// Automatically includes JWT token
const response = await api.get('/matches', { params: { status: 'SCHEDULED' } });
const matches = response.data.matches;
```

### Database Queries

Always use parameterized queries to prevent SQL injection:
```javascript
// Correct
await pool.query('SELECT * FROM matches WHERE id = $1', [matchId]);

// Wrong - never do this
await pool.query(`SELECT * FROM matches WHERE id = ${matchId}`);
```

## Testing Considerations

- No test framework currently configured (package.json scripts has placeholder)
- When adding tests, consider: Jest for backend, React Testing Library for frontend
- Key areas to test: Authentication middleware, SQL validation in AI chat, match statistics calculations

## Database Maintenance

The `last_updated` column in the `matches` table tracks when each match was last fetched from the API. The `update-data.js` script uses this to determine which matches need refreshing in "smart" mode.

For optimal database performance, ensure indexes exist on commonly filtered columns:
```sql
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_updated ON matches(last_updated);
CREATE INDEX IF NOT EXISTS idx_matches_date_status ON matches(utc_date, status);
```

## Deployment Notes

Before production deployment:
1. Change `JWT_SECRET` to a strong random value
2. Use environment variables for all sensitive configuration
3. Set up database connection pooling with appropriate limits
4. Configure CORS to restrict allowed origins
5. Enable HTTPS for all traffic
6. Consider setting up automated data updates via cron jobs (see UPDATE-GUIDE.md for recommended schedules)
7. Review football-data.org API rate limits for your tier
