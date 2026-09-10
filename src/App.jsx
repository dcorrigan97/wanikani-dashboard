import React from 'react';
import { useWaniKaniData } from './hooks/useWaniKaniData.js';
import TokenSetup from './components/TokenSetup.jsx';
import SRSProgress from './components/SRSProgress.jsx';
import AccuracyBreakdown from './components/AccuracyBreakdown.jsx';
import StreakHeatmap from './components/StreakHeatmap.jsx';
import LevelProgression from './components/LevelProgression.jsx';

export default function App() {
  const { token, setToken, clearToken, status, statusMessage, data, error, reload } = useWaniKaniData();

  if (!token) {
    return <TokenSetup onSubmit={setToken} />;
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>
            {data ? `${data.user.username}'s Dashboard` : 'WaniKani Dashboard'}
          </h1>
          {data && (
            <p className="app__meta">
              Level {data.user.level} · last synced{' '}
              {new Date(data.fetchedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="app__actions">
          <button onClick={() => reload()} disabled={status === 'loading'}>
            {status === 'loading' ? 'Syncing…' : 'Refresh'}
          </button>
          <button onClick={() => reload({ forceRefreshSubjects: true })} disabled={status === 'loading'}>
            Full resync
          </button>
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
          {error}
          <button onClick={() => reload()}>Try again</button>
        </div>
      )}

      {data && (
        <main className="grid">
          <SRSProgress assignments={data.assignments} />
          <LevelProgression levelProgressions={data.levelProgressions} />
          <StreakHeatmap reviewStatistics={data.reviewStatistics} assignments={data.assignments} />
          <AccuracyBreakdown reviewStatistics={data.reviewStatistics} subjects={data.subjects} />
        </main>
      )}
    </div>
  );
}
