import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// WaniKani srs_stage: 0 = not started, 1-4 = Apprentice, 5-6 = Guru,
// 7 = Master, 8 = Enlightened, 9 = Burned.
const BUCKETS = [
  { label: 'Apprentice', stages: [1, 2, 3, 4] },
  { label: 'Guru', stages: [5, 6] },
  { label: 'Master', stages: [7] },
  { label: 'Enlightened', stages: [8] },
  { label: 'Burned', stages: [9] },
];

const TYPE_LABELS = { radical: 'Radicals', kanji: 'Kanji', vocabulary: 'Vocabulary' };
const TYPE_COLORS = { radical: '#8da4c2', kanji: '#e2604f', vocabulary: '#d9ae3e' };

// kana_vocabulary (vocab written only in kana, e.g. だから) is visually and
// pedagogically close enough to regular vocabulary to lump together here.
function normalizeType(t) {
  return t === 'kana_vocabulary' ? 'vocabulary' : t;
}

function primaryMeaning(subject) {
  const m = subject?.data?.meanings?.find((x) => x.primary) || subject?.data?.meanings?.[0];
  return m?.meaning ?? 'Unknown';
}

export default function SRSProgress({ assignments, subjects, className = '' }) {
  const [selected, setSelected] = useState(null); // { bucketLabel, type } | null
  const subjectsById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const started = useMemo(() => assignments.filter((a) => a.data.started_at && !a.data.hidden), [assignments]);

  const chartData = useMemo(() => {
    return BUCKETS.map((bucket) => {
      const inBucket = started.filter((a) => bucket.stages.includes(a.data.srs_stage));
      const row = { name: bucket.label };
      ['radical', 'kanji', 'vocabulary'].forEach((type) => {
        row[type] = inBucket.filter((a) => normalizeType(a.data.subject_type) === type).length;
      });
      return row;
    });
  }, [started]);

  const totalStarted = chartData.reduce((sum, d) => sum + d.radical + d.kanji + d.vocabulary, 0);

  const drilldownItems = useMemo(() => {
    if (!selected) return [];
    const bucket = BUCKETS.find((b) => b.label === selected.bucketLabel);
    if (!bucket) return [];
    return started
      .filter((a) => bucket.stages.includes(a.data.srs_stage) && normalizeType(a.data.subject_type) === selected.type)
      .map((a) => subjectsById.get(a.data.subject_id))
      .filter(Boolean)
      .sort((a, b) => (a.data.level ?? 0) - (b.data.level ?? 0));
  }, [selected, started, subjectsById]);

  const handleBarClick = (type) => (data) => {
    setSelected((prev) =>
      prev && prev.bucketLabel === data.name && prev.type === type ? null : { bucketLabel: data.name, type }
    );
  };

  return (
    <div className={`card ${className}`}>
      <h2>SRS Progress</h2>
      <p className="card__subtitle">{totalStarted.toLocaleString()} items currently in the SRS system · tap a bar segment to see the items</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#34291e" />
          <XAxis dataKey="name" stroke="#a59c8a" />
          <YAxis stroke="#a59c8a" allowDecimals={false} />
          <Tooltip contentStyle={{ background: '#221d17', border: '1px solid #34291e' }} />
          <Legend />
          <Bar
            dataKey="radical"
            name="Radicals"
            stackId="a"
            fill={TYPE_COLORS.radical}
            stroke="#171310"
            strokeWidth={2}
            cursor="pointer"
            onClick={handleBarClick('radical')}
          />
          <Bar
            dataKey="kanji"
            name="Kanji"
            stackId="a"
            fill={TYPE_COLORS.kanji}
            stroke="#171310"
            strokeWidth={2}
            cursor="pointer"
            onClick={handleBarClick('kanji')}
          />
          <Bar
            dataKey="vocabulary"
            name="Vocabulary"
            stackId="a"
            fill={TYPE_COLORS.vocabulary}
            stroke="#171310"
            strokeWidth={2}
            radius={[3, 3, 0, 0]}
            cursor="pointer"
            onClick={handleBarClick('vocabulary')}
          />
        </BarChart>
      </ResponsiveContainer>

      {selected && (
        <div className="drilldown">
          <div className="drilldown__header">
            <span>
              {selected.bucketLabel} · {TYPE_LABELS[selected.type]} ({drilldownItems.length})
            </span>
            <button className="drilldown__close" onClick={() => setSelected(null)}>
              ✕
            </button>
          </div>
          <div className="drilldown__grid">
            {drilldownItems.map((subject) => (
              <div className="drilldown__chip" key={subject.id} title={primaryMeaning(subject)}>
                <div className="drilldown__char">{subject.data.characters || '?'}</div>
                <div className="drilldown__meaning">{primaryMeaning(subject)}</div>
              </div>
            ))}
            {drilldownItems.length === 0 && <p className="card__subtitle">No items in this group.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
