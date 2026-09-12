import React, { useMemo, useState } from 'react';

const MIN_ATTEMPTS = 4; // ignore items with too few reviews to mean much

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

export default function AccuracyBreakdown({ reviewStatistics, subjects }) {
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

  const worst = useMemo(() => {
    return reviewStatistics
      .filter((rs) => !rs.data.hidden)
      .map((rs) => {
        const attempts =
          rs.data.meaning_correct +
          rs.data.meaning_incorrect +
          rs.data.reading_correct +
          rs.data.reading_incorrect;
        return { ...rs, attempts };
      })
      .filter((rs) => rs.attempts >= MIN_ATTEMPTS)
      .sort((a, b) => a.data.percentage_correct - b.data.percentage_correct)
      .slice(0, 15);
  }, [reviewStatistics]);

  const visible = expanded ? worst : worst.slice(0, 5);

  return (
    <>
      <h2>Trickiest Items</h2>
      <p className="card__subtitle">Lowest accuracy, min. {MIN_ATTEMPTS} reviews · tap a row to reveal</p>
      <table className="accuracy-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Meaning</th>
            <th>Reading</th>
            <th>Accuracy</th>
            <th>Reviews</th>
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
                <td>
                  <span
                    className="accuracy-pill"
                    style={{
                      background: `rgba(226, 96, 79, ${0.15 + (1 - rs.data.percentage_correct / 100) * 0.35})`,
                    }}
                  >
                    {rs.data.percentage_correct}%
                  </span>
                </td>
                <td>{rs.attempts}</td>
              </tr>
            );
          })}
          {worst.length === 0 && (
            <tr>
              <td colSpan={5}>Not enough review history yet.</td>
            </tr>
          )}
        </tbody>
      </table>
      {worst.length > 5 && (
        <button className="expand-toggle" onClick={() => setExpanded((e) => !e)}>
          {expanded ? '▴ Show less' : `▾ Show all ${worst.length}`}
        </button>
      )}
    </>
  );
}
