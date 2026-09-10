import { useCallback, useEffect, useState } from 'react';
import { wanikani } from '../api/wanikani.js';

const TOKEN_KEY = 'wk_api_token';

export function useWaniKaniData() {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [statusMessage, setStatusMessage] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const setToken = useCallback((newToken) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setTokenState(newToken);
  }, []);

  const clearToken = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setTokenState('');
    setData(null);
    setStatus('idle');
  }, []);

  const load = useCallback(
    async (opts = {}) => {
      if (!token) return;
      setStatus('loading');
      setError(null);
      try {
        setStatusMessage('Fetching user info…');
        const user = await wanikani.getUser(token);

        setStatusMessage('Fetching assignments (SRS progress)…');
        const assignments = await wanikani.getAssignments(token);

        setStatusMessage('Fetching review statistics (accuracy)…');
        const reviewStatistics = await wanikani.getReviewStatistics(token);

        setStatusMessage('Fetching level progressions…');
        const levelProgressions = await wanikani.getLevelProgressions(token);

        setStatusMessage('Fetching subjects (cached after first run)…');
        const subjects = await wanikani.getSubjects(token, {
          forceRefresh: opts.forceRefreshSubjects,
        });

        setData({
          user,
          assignments,
          reviewStatistics,
          levelProgressions,
          subjects,
          fetchedAt: new Date().toISOString(),
        });
        setStatus('ready');
        setStatusMessage('');
      } catch (err) {
        console.error(err);
        setError(err.message || 'Something went wrong talking to the WaniKani API.');
        setStatus('error');
      }
    },
    [token]
  );

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { token, setToken, clearToken, status, statusMessage, data, error, reload: load };
}
