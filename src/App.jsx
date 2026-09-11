import React from 'react';
import { useWaniKaniData } from './hooks/useWaniKaniData.js';
import { usePullToRefresh } from './hooks/usePullToRefresh.js';
import { exportBackup } from './utils/backup.js';
import { forceUpdate } from './utils/swUpdate.js';
import TokenSetup from './components/TokenSetup.jsx';
import SRSProgress from './components/SRSProgress.jsx';
import AccuracyBreakdown from './components/AccuracyBreakdown.jsx';
import StreakHeatmap from './components/StreakHeatmap.jsx';
import LevelProgression from './components/LevelProgression.jsx';
import UpcomingReviews from './components/UpcomingReviews.jsx';
import HistoryTrend from './components/HistoryTrend.jsx';
import LeechDetector from './components/LeechDetector.jsx';
import CardError from './components/CardError.jsx';

export default function App() {
  const { token, setToken, clearToken, status, statusMessage, data, errors, progressHistory, reload, editHistoryEntry, deleteHistoryEntry } =
    useWaniKaniData();

  const { pullDistance, threshold } = usePullToRefresh(() => reload(), status === 'loading' || !token);

  if (!token) {
    return <TokenSetup onSubmit={setToken} />;
  }

  const has = (...keys) => keys.every((k) => data && data[k]);

  return (
    <div className="app">
      <div
        className="pull-indicator"
        style={{ height: pullDistance, opacity: pullDistance > 0 ? 1 : 0 }}
      >
        {pullDistance > threshold ? '↑ Release to refresh' : '↓ Pull to refresh'}
      </div>

      <header className="app__header">
        <div>
          <h1>
            {data?.user ? `${data.user.username}'s Dashboard` : 'WaniKani Dashboard'}
          </h1>
          {data && (
            <p className="app__meta">last synced {new Date(data.fetchedAt).toLocaleTimeString()}</p>
          )}
        </div>
        <div className="app__actions">
          {data?.user && <span className="level-badge">Level {data.user.level}</span>}
          <button onClick={() => reload()} disabled={status === 'loading'}>
            {status === 'loading' ? 'Syncing…' : 'Refresh'}
          </button>
          <button onClick={() => reload({ forceRefreshSubjects: true })} disabled={status === 'loading'}>
            Full resync
          </button>
          <button onClick={exportBackup}>Backup</button>
          <button onClick={forceUpdate}>Check for updates</button>
          <button className="app__signout" onClick={clearToken}>
            Sign out
          </button>
        </div>
      </header>

      {status === 'loading' && !data && (
        <div className="status-message">{statusMessage || 'Loading…'}</div>
      )}

      {status === 'error' && (
        <div className="status-message status-message--error">
          Couldn't reach WaniKani — check your token and connection.
          <button onClick={() => reload()}>Try again</button>
        </div>
      )}

      {data && (
        <main className="grid">
          {has('reviewStatistics', 'assignments') ? (
            <StreakHeatmap
              reviewStatistics={data.reviewStatistics}
              assignments={data.assignments}
              className="tile--streak card--streak"
            />
          ) : (
            <CardError
              label="Study Streak"
              message={errors.reviewStatistics || errors.assignments}
              onRetry={reload}
              className="tile--streak card--streak"
            />
          )}

          {has('assignments', 'subjects') ? (
            <SRSProgress assignments={data.assignments} subjects={data.subjects} className="tile--srs card--indigo" />
          ) : (
            <CardError
              label="SRS Progress"
              message={errors.assignments || errors.subjects}
              onRetry={reload}
              className="tile--srs card--indigo"
            />
          )}

          {has('levelProgressions') ? (
            <LevelProgression levelProgressions={data.levelProgressions} className="tile--level card--gold" />
          ) : (
            <CardError
              label="Level Progression"
              message={errors.levelProgressions}
              onRetry={reload}
              className="tile--level card--gold"
            />
          )}

          {has('assignments') ? (
            <UpcomingReviews assignments={data.assignments} className="tile--upcoming card--indigo" />
          ) : (
            <CardError
              label="Upcoming Reviews"
              message={errors.assignments}
              onRetry={reload}
              className="tile--upcoming card--indigo"
            />
          )}

          {has('reviewStatistics', 'subjects') ? (
            <AccuracyBreakdown
              reviewStatistics={data.reviewStatistics}
              subjects={data.subjects}
              className="tile--trickiest card--sage"
            />
          ) : (
            <CardError
              label="Trickiest Items"
              message={errors.reviewStatistics || errors.subjects}
              onRetry={reload}
              className="tile--trickiest card--sage"
            />
          )}

          {has('assignments', 'reviewStatistics', 'subjects') ? (
            <LeechDetector
              assignments={data.assignments}
              reviewStatistics={data.reviewStatistics}
              subjects={data.subjects}
              className="tile--leeches card--streak"
            />
          ) : (
            <CardError
              label="Leeches"
              message={errors.assignments || errors.reviewStatistics || errors.subjects}
              onRetry={reload}
              className="tile--leeches card--streak"
            />
          )}

          <HistoryTrend
            progressHistory={progressHistory}
            onEditEntry={editHistoryEntry}
            onDeleteEntry={deleteHistoryEntry}
            className="tile--history card--gold"
          />
        </main>
      )}
    </div>
  );
}
