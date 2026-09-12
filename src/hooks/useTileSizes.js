import { useState } from 'react';

const SIZE_KEY = 'wk_tile_sizes_v1';

// Only these tiles support resizing — Study Streak (tall hero) and SRS
// Progress (needs width for 9 bars) keep their fixed sizes.
export const RESIZABLE_IDS = ['trickiest', 'leeches', 'neglected', 'history'];
const DEFAULTS = { trickiest: 'full', leeches: 'full', neglected: 'full', history: 'full' };

export const SIZE_CLASSES = { full: 'span-full', wide: 'span-col2', normal: '' };
const CYCLE = ['full', 'wide', 'normal'];

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
