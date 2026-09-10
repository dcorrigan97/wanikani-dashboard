const HISTORY_KEY = 'wk_history_v1';
const MAX_ENTRIES = 365; // roughly a year of daily snapshots before oldest ones roll off

function localDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function computeSnapshot({ user, assignments, reviewStatistics }) {
  const buckets = { apprentice: 0, guru: 0, master: 0, enlightened: 0, burned: 0 };
  let started = 0;

  assignments.forEach((a) => {
    if (!a.data.started_at || a.data.hidden) return;
    started++;
    const stage = a.data.srs_stage;
    if (stage >= 1 && stage <= 4) buckets.apprentice++;
    else if (stage >= 5 && stage <= 6) buckets.guru++;
    else if (stage === 7) buckets.master++;
    else if (stage === 8) buckets.enlightened++;
    else if (stage === 9) buckets.burned++;
  });

  let accuracySum = 0;
  let accuracyCount = 0;
  reviewStatistics.forEach((rs) => {
    if (rs.data.hidden) return;
    const attempts =
      rs.data.meaning_correct + rs.data.meaning_incorrect + rs.data.reading_correct + rs.data.reading_incorrect;
    if (attempts > 0) {
      accuracySum += rs.data.percentage_correct;
      accuracyCount++;
    }
  });

  return {
    date: localDateKey(new Date()),
    level: user.level,
    started,
    ...buckets,
    accuracyAvg: accuracyCount ? Math.round((accuracySum / accuracyCount) * 10) / 10 : null,
  };
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Save (or overwrite) today's snapshot and return the full trimmed history.
 * Overwriting same-day entries means opening the app 5 times today only
 * ever produces one data point for today, using the latest numbers.
 */
function saveSnapshot(loadedData) {
  const snapshot = computeSnapshot(loadedData);
  const history = loadHistory();
  const idx = history.findIndex((h) => h.date === snapshot.date);
  if (idx >= 0) {
    history[idx] = snapshot;
  } else {
    history.push(snapshot);
  }
  history.sort((a, b) => (a.date < b.date ? -1 : 1));
  const trimmed = history.slice(-MAX_ENTRIES);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Could not save history snapshot:', err.message);
  }
  return trimmed;
}

export const history = { loadHistory, saveSnapshot };
