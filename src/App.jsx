import React, { useEffect, useRef, useState } from 'react';
import Sortable from 'sortablejs';
import { useWaniKaniData } from './hooks/useWaniKaniData.js';
import { usePullToRefresh } from './hooks/usePullToRefresh.js';
import { useTileOrder } from './hooks/useTileOrder.js';
import { useTileSizes, SIZE_CLASSES } from './hooks/useTileSizes.js';
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
import NeglectedItems from './components/NeglectedItems.jsx';
import CardError from './components/CardError.jsx';

export default function App() {
  const {
    token,
    setToken,
    clearToken,
    status,
    statusMessage,
    data,
    errors,
    progressHistory,
    reload,
    editHistoryEntry,
    deleteHistoryEntry,
  } = useWaniKaniData();

  const { order, setOrder, resetOrder } = useTileOrder();
  const { sizes, cycleSize, resetSizes } = useTileSizes();
  const [editingLayout, setEditingLayout] = useState(false);
  const gridRef = useRef(null);
  const sortableRef = useRef(null);

  const { pullDistance, threshold } = usePullToRefresh(
    () => reload(),
    status === 'loading' || !token || editingLayout
  );

  useEffect(() => {
    if (editingLayout && gridRef.current) {
      sortableRef.current = Sortable.create(gridRef.current, {
        animation: 150,
        handle: '.tile-drag-handle',
        onEnd: (evt) => {
          if (evt.oldIndex === evt.newIndex) return;
          setOrder((prevOrder) => {
            const next = [...prevOrder];
            const [moved] = next.splice(evt.oldIndex, 1);
            next.splice(evt.newIndex, 0, moved);
            return next;
          });
        },
      });
    }
    return () => {
      if (sortableRef.current) {
        sortableRef.current.destroy();
        sortableRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingLayout]);

  if (!token) {
    return <TokenSetup onSubmit={setToken} />;
  }

  const has = (...keys) => keys.every((k) => data && data[k]);

  const TILE_DEFS = {
    streak: {
      label: 'Study Streak',
      extraClass: 'span-tall2',
      accentClass: 'card--streak',
      render: () =>
        has('reviewStatistics', 'assignments') ? (
          <StreakHeatmap reviewStatistics={data.reviewStatistics} assignments={data.assignments} />
        ) : (
          <CardError label="Study Streak" message={errors.reviewStatistics || errors.assignments} onRetry={reload} />
        ),
    },
    srs: {
      label: 'SRS Progress',
      accentClass: 'card--indigo',
      render: () =>
        has('assignments', 'subjects') ? (
          <SRSProgress assignments={data.assignments} subjects={data.subjects} />
        ) : (
          <CardError label="SRS Progress" message={errors.assignments || errors.subjects} onRetry={reload} />
        ),
    },
    level: {
      label: 'Level Progression',
      accentClass: 'card--gold',
      render: () =>
        has('levelProgressions') ? (
          <LevelProgression levelProgressions={data.levelProgressions} />
        ) : (
          <CardError label="Level Progression" message={errors.levelProgressions} onRetry={reload} />
        ),
    },
    upcoming: {
      label: 'Upcoming Reviews',
      accentClass: 'card--indigo',
      render: () =>
        has('assignments') ? (
          <UpcomingReviews assignments={data.assignments} />
        ) : (
          <CardError label="Upcoming Reviews" message={errors.assignments} onRetry={reload} />
        ),
    },
    trickiest: {
      label: 'Trickiest Items',
      accentClass: 'card--sage',
      render: () =>
        has('reviewStatistics', 'subjects') ? (
          <AccuracyBreakdown reviewStatistics={data.reviewStatistics} subjects={data.subjects} />
        ) : (
          <CardError label="Trickiest Items" message={errors.reviewStatistics || errors.subjects} onRetry={reload} />
        ),
    },
    leeches: {
      label: 'Leeches',
      accentClass: 'card--streak',
      render: () =>
        has('assignments', 'reviewStatistics', 'subjects') ? (
          <LeechDetector
            assignments={data.assignments}
            reviewStatistics={data.reviewStatistics}
            subjects={data.subjects}
          />
        ) : (
          <CardError
            label="Leeches"
            message={errors.assignments || errors.reviewStatistics || errors.subjects}
            onRetry={reload}
          />
        ),
    },
    neglected: {
      label: "Haven't Seen Lately",
      accentClass: 'card--indigo',
      render: () =>
        has('assignments', 'reviewStatistics', 'subjects') ? (
          <NeglectedItems
            assignments={data.assignments}
            reviewStatistics={data.reviewStatistics}
            subjects={data.subjects}
          />
        ) : (
          <CardError
            label="Haven't Seen Lately"
            message={errors.assignments || errors.reviewStatistics || errors.subjects}
            onRetry={reload}
          />
        ),
    },
    history: {
      label: 'Progress Over Time',
      accentClass: 'card--gold',
      render: () => (
        <HistoryTrend
          progressHistory={progressHistory}
          onEditEntry={editHistoryEntry}
          onDeleteEntry={deleteHistoryEntry}
        />
      ),
    },
  };

  return (
    <div className="app">
      <div className="pull-indicator" style={{ height: pullDistance, opacity: pullDistance > 0 ? 1 : 0 }}>
        {pullDistance > threshold ? '↑ Release to refresh' : '↓ Pull to refresh'}
      </div>

      <header className="app__header">
        <div>
          <h1>{data?.user ? `${data.user.username}'s Dashboard` : 'WaniKani Dashboard'}</h1>
          {data && <p className="app__meta">last synced {new Date(data.fetchedAt).toLocaleTimeString()}</p>}
        </div>
        <div className="app__actions">
          {data?.user && <span className="level-badge">Level {data.user.level}</span>}
          {editingLayout ? (
            <>
              <button
                onClick={() => {
                  resetOrder();
                  resetSizes();
                }}
              >
                Reset layout
              </button>
              <button onClick={() => setEditingLayout(false)}>Done</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditingLayout(true)}>Edit layout</button>
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
            </>
          )}
        </div>
      </header>

      {status === 'loading' && !data && <div className="status-message">{statusMessage || 'Loading…'}</div>}

      {status === 'error' && (
        <div className="status-message status-message--error">
          Couldn't reach WaniKani — check your token and connection.
          <button onClick={() => reload()}>Try again</button>
        </div>
      )}

      {data && (
        <main className="grid" ref={gridRef}>
          {order.map((id) => {
            const def = TILE_DEFS[id];
            if (!def) return null;
            const sizeClass = SIZE_CLASSES[sizes[id] || 'full'];
            const extraClass = def.extraClass || '';
            return (
              <div
                key={id}
                data-tile-id={id}
                className={`card ${def.accentClass} ${sizeClass} ${extraClass} ${editingLayout ? 'card--editing' : ''}`}
              >
                {editingLayout && (
                  <>
                    <div className="tile-drag-handle">⠿</div>
                    <button className="tile-resize-handle" onClick={() => cycleSize(id)}>
                      {sizes[id] || 'full'}
                    </button>
                  </>
                )}
                {def.render()}
              </div>
            );
          })}
        </main>
      )}
    </div>
  );
}
