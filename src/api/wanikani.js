const BASE_URL = 'https://api.wanikani.com/v2';
const REVISION = '20170710';

function headers(token) {
  return {
    'Wanikani-Revision': REVISION,
    Authorization: `Bearer ${token}`,
  };
}

async function fetchJson(url, token) {
  const res = await fetch(url, { headers: headers(token) });
  if (res.status === 401) {
    throw new Error('Invalid API token (401). Check the token in Settings.');
  }
  if (!res.ok) {
    throw new Error(`WaniKani API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch every page of a collection endpoint.
 * WaniKani paginates at up to 1000 items/page and gives a full next_url,
 * so we just follow pages.next_url until it's null.
 */
async function fetchAllPages(token, endpoint, params = {}) {
  const url = new URL(BASE_URL + endpoint);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  let items = [];
  let nextUrl = url.toString();
  while (nextUrl) {
    const json = await fetchJson(nextUrl, token);
    items = items.concat(json.data);
    nextUrl = json.pages?.next_url ?? null;
  }
  return items;
}

async function fetchSingle(token, endpoint) {
  const json = await fetchJson(BASE_URL + endpoint, token);
  return json.data;
}

// --- Subjects are large (10k+) and rarely change, so we cache them hard. ---
// Raw subject objects carry a lot the dashboard never uses (full mnemonics,
// context sentences, pronunciation-audio URL lists, related-subject id
// arrays, etc.) — vocabulary items in particular can carry dozens of audio
// entries each. Caching the raw objects blows past the ~5-10MB localStorage
// quota, so we slim each subject down to just what the components read.
const SUBJECTS_CACHE_KEY = 'wk_subjects_cache_v2';
const SUBJECTS_CACHE_META_KEY = 'wk_subjects_cache_meta_v2';

function slimSubject(s) {
  return {
    id: s.id,
    data: {
      characters: s.data.characters,
      meanings: s.data.meanings,
      level: s.data.level,
    },
  };
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    // Quota exceeded or storage unavailable — don't crash the app over a
    // cache write. We just lose the speed-up from caching, not correctness.
    console.warn(`Could not cache ${key}:`, err.message);
    return false;
  }
}

async function getSubjects(token, { forceRefresh = false } = {}) {
  const meta = JSON.parse(localStorage.getItem(SUBJECTS_CACHE_META_KEY) || 'null');
  const cached = localStorage.getItem(SUBJECTS_CACHE_KEY);

  if (!forceRefresh && cached && meta?.lastUpdatedAfter) {
    // Incremental update: only ask for subjects changed since last fetch.
    const updated = await fetchAllPages(token, '/subjects', {
      updated_after: meta.lastUpdatedAfter,
    });
    const existing = JSON.parse(cached);
    if (updated.length === 0) {
      return existing;
    }
    const byId = new Map(existing.map((s) => [s.id, s]));
    updated.forEach((s) => byId.set(s.id, slimSubject(s)));
    const merged = Array.from(byId.values());
    if (safeSetItem(SUBJECTS_CACHE_KEY, JSON.stringify(merged))) {
      safeSetItem(
        SUBJECTS_CACHE_META_KEY,
        JSON.stringify({ lastUpdatedAfter: new Date().toISOString() })
      );
    }
    return merged;
  }

  // Full fetch (first run or forced refresh).
  const all = await fetchAllPages(token, '/subjects');
  const slim = all.map(slimSubject);
  if (safeSetItem(SUBJECTS_CACHE_KEY, JSON.stringify(slim))) {
    safeSetItem(
      SUBJECTS_CACHE_META_KEY,
      JSON.stringify({ lastUpdatedAfter: new Date().toISOString() })
    );
  }
  return slim;
}

function clearSubjectsCache() {
  localStorage.removeItem(SUBJECTS_CACHE_KEY);
  localStorage.removeItem(SUBJECTS_CACHE_META_KEY);
  // Also clear the old (pre-slimming) cache key in case it's still sitting
  // there from before this fix, taking up quota space.
  localStorage.removeItem('wk_subjects_cache_v1');
  localStorage.removeItem('wk_subjects_cache_meta_v1');
}

async function getUser(token) {
  return fetchSingle(token, '/user');
}

async function getAssignments(token) {
  return fetchAllPages(token, '/assignments');
}

async function getReviewStatistics(token) {
  return fetchAllPages(token, '/review_statistics');
}

async function getLevelProgressions(token) {
  return fetchAllPages(token, '/level_progressions');
}

export const wanikani = {
  getUser,
  getAssignments,
  getReviewStatistics,
  getLevelProgressions,
  getSubjects,
  clearSubjectsCache,
};
