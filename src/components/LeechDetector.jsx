import React, { useMemo } from 'react';

const MIN_ATTEMPTS = 6; // enough reviews that "still stuck" is a real signal, not noise
const STUCK_STAGES = [0, 1, 2, 3, 4]; // not yet past Apprentice

function primaryMeaning(subject) {
  const m = subject?.data?.meanings?.find((x) => x.primary) || subject?.data?.meanings?.[0];
  return m?.meaning ?? 'Unknown';
}

function displayCharacters(subject) {
  if (!subject) return '?';
  if (subject.data.characters) return subject.data.characters;
  return '(radical image)';
}

export default function LeechDetector({ assignments, reviewStatistics, subjects, className = '' }) {
  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const stageBySubjectId = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => {
      if (a.data.hidden) return;
      map.set(a.data.subject_id, a.data.srs_stage);
    });
    return map;
  }, [assignments]);

  const leeches = useMemo(() => {
    return reviewStatistics
      .filter((rs) => !rs.data.hidden)
      .map((rs) => {
        const attempts =
          rs.data.meaning_correct + rs.data.meaning_incorrect + rs.data.reading_correct + rs.data.reading_incorrect;
        const stage = stageBySubjectId.get(rs.data.subject_id) ?? 0;
        return { ...rs, attempts, stage };
      })
      .filter((rs) => rs.attempts >= MIN_ATTEMPTS && STUCK_STAGES.includes(rs.stage))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10);
  }, [reviewStatistics, stageBySubjectId]);

  return (
    <div className={`card ${className}`}>
      <h2>Leeches</h2>
      <p className="card__subtitle">
        Stuck below Guru despite {MIN_ATTEMPTS}+ reviews — worth extra attention
      </p>
      <table className="accuracy-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Meaning</th>
            <th>Accuracy</th>
            <th>Attempts</th>
          </tr>
        </thead>
        <tbody>
          {leeches.map((rs) => {
            const subject = subjectsById.get(rs.data.subject_id);
            return (
              <tr key={rs.id}>
                <td className="accuracy-table__char">{displayCharacters(subject)}</td>
                <td>{primaryMeaning(subject)}</td>
                <td>
                  <span
                    className="accuracy-pill"
                    style={{ background: `rgba(226, 96, 79, ${0.15 + (1 - rs.data.percentage_correct / 100) * 0.35})` }}
                  >
                    {rs.data.percentage_correct}%
                  </span>
                </td>
                <td>{rs.attempts}</td>
              </tr>
            );
          })}
          {leeches.length === 0 && (
            <tr>
              <td colSpan={4}>No leeches right now — nice.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
