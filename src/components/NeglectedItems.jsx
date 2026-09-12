import React, { useMemo, useState } from 'react';

const MIN_DAYS = 3; // don't bother surfacing things reviewed within the last few days

const TYPE_COLORS = { radical: '#8da4c2', kanji: '#e2604f', vocabulary: '#d9ae3e' };
const TYPE_LABELS = { radical: 'Radical', kanji: 'Kanji', vocabulary: 'Vocabulary' };

// kana_vocabulary (vocab written only in kana, e.g. だから) is grouped with
// regular vocabulary here, same as the SRS Progress chart.
function normalizeType(t) {
  return t === 'kana_vocabulary' ? 'vocabulary' : t;
}

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

function normalize(str) {
  return str.trim().toLowerCase();
}

// Accept any meaning WaniKani lists for the item, not just the primary one.
function checkMeaning(subject, input) {
  const meanings = subject?.data?.meanings || [];
  const normalizedInput = normalize(input);
  if (!normalizedInput) return false;
  return meanings.some((m) => normalize(m.meaning) === normalizedInput);
}

// Only primary readings are cached, so this checks against those.
function checkReading(subject, input) {
  const readings = subject?.data?.readings || [];
  const trimmed = input.trim();
  if (!trimmed) return false;
  return readings.some((r) => r === trimmed);
}

function QuizRow({ subject, days, type }) {
  const [meaningInput, setMeaningInput] = useState('');
  const [readingInput, setReadingInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const hasReading = (subject?.data?.readings?.length || 0) > 0;
  const meaningCorrect = checked && checkMeaning(subject, meaningInput);
  const readingCorrect = checked && (!hasReading || checkReading(subject, readingInput));
  const allCorrect = meaningCorrect && readingCorrect;
  const typeColor = TYPE_COLORS[type];

  const handleCheck = (e) => {
    e.preventDefault();
    setChecked(true);
  };

  const handleRetry = () => {
    setMeaningInput('');
    setReadingInput('');
    setChecked(false);
    // Forces the form (and its inputs) to fully remount on retry, so there's
    // no chance of a disabled/value attribute lingering from the checked state.
    setAttempt((a) => a + 1);
  };

  return (
    <div className={`quiz-row ${checked ? (allCorrect ? 'quiz-row--correct' : 'quiz-row--incorrect') : ''}`}>
      <div className="quiz-row__char" style={{ color: typeColor }} title={TYPE_LABELS[type]}>
        {displayCharacters(subject)}
      </div>
      <div className="quiz-row__meta">
        <span className="quiz-row__type" style={{ color: typeColor }}>
          {TYPE_LABELS[type]}
        </span>
        <span>{days}d ago</span>
      </div>
      <form className="quiz-row__form" onSubmit={handleCheck} key={attempt}>
        {hasReading && (
          <input
            type="text"
            placeholder="Reading"
            defaultValue=""
            onChange={(e) => setReadingInput(e.target.value)}
            disabled={checked}
            className={checked ? (readingCorrect ? 'quiz-input--correct' : 'quiz-input--incorrect') : ''}
          />
        )}
        <input
          type="text"
          placeholder="Meaning"
          defaultValue=""
          onChange={(e) => setMeaningInput(e.target.value)}
          disabled={checked}
          className={checked ? (meaningCorrect ? 'quiz-input--correct' : 'quiz-input--incorrect') : ''}
        />
        {!checked ? (
          <button type="submit">Check</button>
        ) : (
          <button type="button" onClick={handleRetry}>
            Retry
          </button>
        )}
      </form>
      {checked && !allCorrect && (
        <div className="quiz-row__answer">
          {!meaningCorrect && <span>Meaning: {primaryMeaning(subject)}</span>}
          {hasReading && !readingCorrect && <span>Reading: {primaryReading(subject)}</span>}
        </div>
      )}
    </div>
  );
}

export default function NeglectedItems({ assignments, reviewStatistics, subjects }) {
  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const [expanded, setExpanded] = useState(false);

  const stageBySubjectId = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => {
      if (a.data.hidden) return;
      map.set(a.data.subject_id, a.data.srs_stage);
    });
    return map;
  }, [assignments]);

  const typeBySubjectId = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => {
      if (a.data.hidden) return;
      map.set(a.data.subject_id, normalizeType(a.data.subject_type));
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
        For self-practice only — doesn't submit anything back to WaniKani · type your answer and check
      </p>
      <div className="quiz-list">
        {visible.map((rs) => (
          <QuizRow
            key={rs.id}
            subject={subjectsById.get(rs.data.subject_id)}
            days={rs.days}
            type={typeBySubjectId.get(rs.data.subject_id)}
          />
        ))}
        {neglected.length === 0 && (
          <p className="card__subtitle">Nothing's been neglected — you're keeping up with everything.</p>
        )}
      </div>
      {neglected.length > 5 && (
        <button className="expand-toggle" onClick={() => setExpanded((e) => !e)}>
          {expanded ? '▴ Show less' : `▾ Show all ${neglected.length}`}
        </button>
      )}
    </>
  );
}
