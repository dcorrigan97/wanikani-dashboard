import React, { useMemo, useState } from 'react';

const MIN_DAYS = 3; // don't bother surfacing things reviewed within the last few days

function primaryMeaning(subject) {
  const m = subject?.data?.meanings?.find((x) => x.primary) || subject?.data?.meanings?.[0];
  return m?.meaning ?? 'Unknown';
}

function primaryReading(subject) {
  const readings = subject?.data?.readings;
  return readings && readings.length ? readings.join('、') : '—';
}

function displayCharacters(subject) {
  if (!subject) return '?';
  if (subject.data.characters) return subject.data.characters;
  return '(radical image)';
}

function daysSince(dateStr) {
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export default function NeglectedItems({ assignments, reviewStatistics, subjects }) {
  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const [revealed, setRevealed] = useState(new Set());
  const [expanded, setExpanded] = useState(false);

  const toggle = (id) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stageBySubjectId = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => {
      if (a.data.hidden) return;
      map.set(a.data.subject_id, a.data.srs_stage);
    });
    return map;
  }, [assignments]);

  const neglected = useMemo(() => {
    return reviewStatistics
      .filter((rs) => !rs.data.hidden && rs.data_updated_at)
      .map((rs) => {
        const stage = stageBySubjectId.get(rs.data.subject_id) ?? 0;
        return { ...rs, stage, days: daysSince(rs.data_updated_at) };
      })
      // Burned items are considered "done" by WaniKani's own design — no
      // need to nag about those. Only surface things still active in SRS.
      .filter((rs) => rs.stage > 0 && rs.stage < 9 && rs.days >= MIN_DAYS)
      .sort((a, b) => b.days - a.days)
      .slice(0, 20);
  }, [reviewStatistics, stageBySubjectId]);

  const visible = expanded ? neglected : neglected.slice(0, 5);

  return (
    <>
      <h2>Haven't Seen Lately</h2>
      <p className="card__subtitle">
        For self-practice only — doesn't submit anything back to WaniKani · tap a row to reveal
      </p>
      <table className="accuracy-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Meaning</th>
            <th>Reading</th>
            <th>Last seen</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((rs) => {
            const subject = subjectsById.get(rs.data.subject_id);
            const isRevealed = revealed.has(rs.id);
            const hideStyle = { filter: isRevealed ? 'none' : 'blur(6px)', transition: 'filter 0.15s' };
            return (
              <tr key={rs.id} onClick={() => toggle(rs.id)} style={{ cursor: 'pointer' }}>
                <td className="accuracy-table__char">{displayCharacters(subject)}</td>
                <td style={hideStyle}>{primaryMeaning(subject)}</td>
                <td className="accuracy-table__char" style={hideStyle}>
                  {primaryReading(subject)}
                </td>
                <td>{rs.days}d ago</td>
              </tr>
            );
          })}
          {neglected.length === 0 && (
            <tr>
              <td colSpan={4}>Nothing's been neglected — you're keeping up with everything.</td>
            </tr>
          )}
        </tbody>
      </table>
      {neglected.length > 5 && (
        <button className="expand-toggle" onClick={() => setExpanded((e) => !e)}>
          {expanded ? '▴ Show less' : `▾ Show all ${neglected.length}`}
        </button>
      )}
    </>
  );
}
