import React, { useMemo, useState } from 'react';

const WEEKS_TO_SHOW = 12; // narrower tile in the bento layout than before
const COLORS = ['#2c2419', '#3d2620', '#6b2f28', '#a8412f', '#e2604f'];

function formatDateShort(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Local-timezone Y-M-D key, NOT toISOString() — toISOString converts to UTC,
// which shifts evening activity onto the wrong calendar day for anyone west
// of UTC (e.g. US Central). Every timestamp below is keyed this same way so
// they all line up on the same calendar-day grid.
function localDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function colorForCount(count, max) {
  if (count === 0) return COLORS[0];
  const ratio = count / max;
  if (ratio > 0.75) return COLORS[4];
  if (ratio > 0.5) return COLORS[3];
  if (ratio > 0.25) return COLORS[2];
  return COLORS[1];
}

/**
 * WaniKani deprecated the /reviews endpoint in April 2023 — it now always
 * returns an empty array (they stopped storing individual review events).
 * We approximate daily activity from two remaining signals:
 *  - review_statistics[].data_updated_at — last time each item was reviewed
 *  - assignments[].data.started_at — when a lesson was started for each item
 * The second one matters because a new item needs ~4 hours after its lesson
 * before it's even eligible for its first review, so a lesson-only day
 * (common right after starting the app) would otherwise show as inactive
 * even though you were studying that day.
 */
export default function StreakHeatmap({ reviewStatistics, assignments }) {
  const [activeDay, setActiveDay] = useState(null);
  const { days, max, currentStreak, itemsTracked } = useMemo(() => {
    const counts = new Map();
    const bump = (key) => counts.set(key, (counts.get(key) || 0) + 1);

    reviewStatistics.forEach((rs) => {
      if (rs.data_updated_at) bump(localDateKey(new Date(rs.data_updated_at)));
    });
    assignments.forEach((a) => {
      if (a.data.started_at) bump(localDateKey(new Date(a.data.started_at)));
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = WEEKS_TO_SHOW * 7;
    const days = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = localDateKey(d);
      days.push({ key, count: counts.get(key) || 0 });
    }

    const max = Math.max(1, ...days.map((d) => d.count));

    let currentStreak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) currentStreak++;
      else break;
    }

    return { days, max, currentStreak, itemsTracked: reviewStatistics.length };
  }, [reviewStatistics, assignments]);

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <>
      <h2>Study Streak</h2>
      <div className="streak-hero">
        <div className="streak-hero__num">{currentStreak}</div>
        <p className="card__subtitle" style={{ margin: 0 }}>
          day{currentStreak === 1 ? '' : 's'} in a row · {itemsTracked.toLocaleString()} items tracked
        </p>
      </div>
      <div className="heatmap-info">
        {activeDay
          ? `${formatDateShort(activeDay.key)} — activity on ${activeDay.count} item${activeDay.count === 1 ? '' : 's'}`
          : 'Hover or tap a square to see that day'}
      </div>
      <div className="heatmap-grid" style={{ justifyContent: 'center', marginTop: '6px' }}>
        {weeks.map((week, wi) => (
          <div className="heatmap-grid__col" key={wi}>
            {week.map((day) => (
              <div
                key={day.key}
                className="heatmap-grid__cell"
                style={{ backgroundColor: colorForCount(day.count, max) }}
                onMouseEnter={() => setActiveDay(day)}
                onMouseLeave={() => setActiveDay(null)}
                onClick={() => setActiveDay(day)}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="card__footnote">
        WaniKani no longer exposes per-review history via the API, so this approximates daily activity from lesson
        start dates and last-reviewed dates rather than a full event log.
      </p>
    </>
  );
}
