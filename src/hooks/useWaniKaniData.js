import { useCallback, useEffect, useRef, useState } from 'react';
import { wanikani } from '../api/wanikani.js';
import { history } from '../utils/history.js';

const TOKEN_KEY = 'wk_api_token';

export function useWaniKaniData() {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [statusMessage, setStatusMessage] = useState('');
  const [data, setData] = useState(null);
  const [errors, setErrors] = useState({}); // { user, assignments, reviewStatistics, levelProgressions, subjects }
  const [progressHistory, setProgressHistory] = useState(() => history.loadHistory());
  const dataRef = useRef(null);
  dataRef.current = data;

  const setToken = useCallback((newToken) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setTokenState(newToken);
  }, []);

  const clearToken = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setTokenState('');
    setData(null);
    setErrors({});
    setStatus('idle');
  }, []);

  const load = useCallback(
    async (opts = {}) => {
      if (!token) return;
      setStatus('loading');
      setStatusMessage('Syncing with WaniKani…');

      const [userR, assignmentsR, reviewStatsR, levelProgR, subjectsR] = await Promise.allSettled([
        wanikani.getUser(token),
        wanikani.getAssignments(token),
        wanikani.getReviewStatistics(token),
        wanikani.getLevelProgressions(token),
        wanikani.getSubjects(token, { forceRefresh: opts.forceRefreshSubjects }),
      ]);

      const prev = dataRef.current;
      const pick = (result, key) => (result.status === 'fulfilled' ? result.value : prev?.[key]);

      const newData = {
        user: pick(userR, 'user'),
        assignments: pick(assignmentsR, 'assignments'),
        reviewStatistics: pick(reviewStatsR, 'reviewStatistics'),
        levelProgressions: pick(levelProgR, 'levelProgressions'),
        subjects: pick(subjectsR, 'subjects'),
        fetchedAt: new Date().toISOString(),
      };

      const newErrors = {};
      [
        ['user', userR],
        ['assignments', assignmentsR],
        ['reviewStatistics', reviewStatsR],
        ['levelProgressions', levelProgR],
        ['subjects', subjectsR],
      ].forEach(([key, result]) => {
        if (result.status === 'rejected') {
          console.error(`Failed to fetch ${key}:`, result.reason);
          newErrors[key] = result.reason?.message || 'Failed to load.';
        }
      });

      const allFailed = Object.keys(newErrors).length === 5;

      if (allFailed) {
        // Nothing loaded at all — most likely a bad/expired token. Don't
        // publish a data object with everything empty; show a real error.
        setErrors(newErrors);
        setStatus('error');
        setStatusMessage('');
        return;
      }

      setData(newData);
      setErrors(newErrors);
      if (newData.user && newData.assignments && newData.reviewStatistics) {
        setProgressHistory(history.saveSnapshot(newData));
      }
      setStatus('ready');
      setStatusMessage('');
    },
    [token]
  );

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { token, setToken, clearToken, status, statusMessage, data, errors, progressHistory, reload: load };
}
