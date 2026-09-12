import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// WaniKani srs_stage: 0 = not started, 1-4 = Apprentice, 5-6 = Guru,
// 7 = Master, 8 = Enlightened, 9 = Burned. Broken into individual sub-stages
// here (matching WaniKani's own "Active Item Spread" chart) instead of
// collapsing Apprentice/Guru into one bucket each.
const BUCKETS = [
  { label: 'Apprentice 1', stages: [1] },
  { label: 'Apprentice 2', stages: [2] },
  { label: 'Apprentice 3', stages: [3] },
  { label: 'Apprentice 4', stages: [4] },
  { label: 'Guru 1', stages: [5] },
  { label: 'Guru 2', stages: [6] },
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

function primaryReading(subject) {
  const readings = subject?.data?.readings;
  return readings && readings.length ? readings.join('、') : '—';
}

export default function SRSProgress({ assignments, subjects }) {
  const [selected, setSelected] = useState(null); // { bucketLabel, type } | null
  const [expandedChips, setExpandedChips] = useState(new Set());
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
    setExpandedChips(new Set());
  };

  const toggleChip = (id) => {
    setExpandedChips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <h2>SRS Progress</h2>
      <p className="card__subtitle">{totalStarted.toLocaleString()} items currently in the SRS system · tap a bar segment to see the items</p>
      <ResponsiveContainer width="100%" height={310} className="srs-chart">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#34291e" />
          <XAxis dataKey="name" stroke="#a59c8a" angle={-40} textAnchor="end" interval={0} tick={{ fontSize: 11 }} height={50} />
          <YAxis stroke="#a59c8a" allowDecimals={false} />
          <Tooltip contentStyle={{ background: '#221d17', border: '1px solid #34291e' }}
            allowEscapeViewBox={{ x: true, y: true }}
            offset={24} cursor={false} />
          <Legend />
          <Bar dataKey="radical" name="Radicals" stackId="a" fill={TYPE_COLORS.radical} cursor="pointer" onClick={handleBarClick('radical')} />
          <Bar dataKey="kanji" name="Kanji" stackId="a" fill={TYPE_COLORS.kanji} cursor="pointer" onClick={handleBarClick('kanji')} />
          <Bar
            dataKey="vocabulary"
            name="Vocabulary"
            stackId="a"
            fill={TYPE_COLORS.vocabulary}
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
            {drilldownItems.map((subject) => {
              const isOpen = expandedChips.has(subject.id);
              return (
                <div
                  className={`drilldown__chip ${isOpen ? 'drilldown__chip--open' : ''}`}
                  key={subject.id}
                  onClick={() => toggleChip(subject.id)}
                >
                  <div className="drilldown__char">{subject.data.characters || '?'}</div>
                  {isOpen && (
                    <>
                      <div className="drilldown__reading">{primaryReading(subject)}</div>
                      <div className="drilldown__meaning">{primaryMeaning(subject)}</div>
                    </>
                  )}
                </div>
              );
            })}
            {drilldownItems.length === 0 && <p className="card__subtitle">No items in this group.</p>}
          </div>
        </div>
      )}
    </>
  );
}
