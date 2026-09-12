import { useState } from 'react';

const SIZE_KEY = 'wk_tile_sizes_v2';

// quarter = 1 of 4 columns, normal = 2, wide = 3, full = all 4.
export const SIZE_CLASSES = { quarter: 'span-1', normal: 'span-2', wide: 'span-3', full: 'span-full' };
const CYCLE = ['quarter', 'normal', 'wide', 'full'];

// Defaults match the look the dashboard already had before per-tile sizing
// existed: Streak/Level/Upcoming were narrow (quarter), SRS was wide, and
// the tables/history chart were full-width.
const DEFAULTS = {
  streak: 'quarter',
  srs: 'wide',
  level: 'quarter',
  upcoming: 'quarter',
  trickiest: 'full',
  leeches: 'full',
  neglected: 'full',
  history: 'full',
};

function loadSizes() {
  try {
    const saved = JSON.parse(localStorage.getItem(SIZE_KEY));
    if (saved && typeof saved === 'object') {
      return { ...DEFAULTS, ...saved };
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULTS };
}

export function useTileSizes() {
  const [sizes, setSizes] = useState(loadSizes);

  const persist = (next) => {
    setSizes(next);
    try {
      localStorage.setItem(SIZE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn('Could not save tile sizes:', err.message);
    }
  };

  const cycleSize = (id) => {
    const current = sizes[id] || 'full';
    const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
    persist({ ...sizes, [id]: next });
  };

  const resetSizes = () => persist({ ...DEFAULTS });

  return { sizes, cycleSize, resetSizes };
}
