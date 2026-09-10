import React, { useMemo } from 'react';

const MIN_ATTEMPTS = 4; // ignore items with too few reviews to mean much

function primaryMeaning(subject) {
  const m = subject?.data?.meanings?.find((x) => x.primary) || subject?.data?.meanings?.[0];
  return m?.meaning ?? 'Unknown';
}

function displayCharacters(subject) {
  if (!subject) return '?';
  if (subject.data.characters) return subject.data.characters;
  return '(radical image)';
}

export default function AccuracyBreakdown({ reviewStatistics, subjects, className = '' }) {
  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

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

  return (
    <div className={`card ${className}`}>
      <h2>Trickiest Items</h2>
      <p className="card__subtitle">Lowest accuracy, min. {MIN_ATTEMPTS} reviews</p>
      <table className="accuracy-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Meaning</th>
            <th>Accuracy</th>
            <th>Reviews</th>
          </tr>
        </thead>
        <tbody>
          {worst.map((rs) => {
            const subject = subjectsById.get(rs.data.subject_id);
            return (
              <tr key={rs.id}>
                <td className="accuracy-table__char">{displayCharacters(subject)}</td>
                <td>{primaryMeaning(subject)}</td>
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
              <td colSpan={4}>Not enough review history yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
