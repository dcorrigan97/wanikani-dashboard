import { useState } from 'react';

const ORDER_KEY = 'wk_tile_order_v1';
export const DEFAULT_ORDER = ['streak', 'srs', 'level', 'upcoming', 'trickiest', 'leeches', 'neglected', 'history'];

function loadOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDER_KEY));
    if (Array.isArray(saved) && saved.length) {
      // Keep only tiles that still exist, then append any new tile ids
      // (e.g. from a future update) that aren't in the saved order yet.
      const merged = saved.filter((id) => DEFAULT_ORDER.includes(id));
      DEFAULT_ORDER.forEach((id) => {
        if (!merged.includes(id)) merged.push(id);
      });
      return merged;
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_ORDER;
}

export function useTileOrder() {
  const [order, setOrderState] = useState(loadOrder);

  const setOrder = (next) => {
    setOrderState(next);
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn('Could not save tile order:', err.message);
    }
  };

  const resetOrder = () => setOrder(DEFAULT_ORDER);

  return { order, setOrder, resetOrder };
}
