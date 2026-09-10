import React, { useMemo } from 'react';
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

const TYPE_COLORS = { radical: '#8da4c2', kanji: '#e2604f', vocabulary: '#d9ae3e' };

// kana_vocabulary (vocab written only in kana, e.g. だから) is visually and
// pedagogically close enough to regular vocabulary to lump together here.
function normalizeType(t) {
  return t === 'kana_vocabulary' ? 'vocabulary' : t;
}

export default function SRSProgress({ assignments, className = '' }) {
  const chartData = useMemo(() => {
    const started = assignments.filter((a) => a.data.started_at && !a.data.hidden);
    return BUCKETS.map((bucket) => {
      const inBucket = started.filter((a) => bucket.stages.includes(a.data.srs_stage));
      const row = { name: bucket.label };
      ['radical', 'kanji', 'vocabulary'].forEach((type) => {
        row[type] = inBucket.filter((a) => normalizeType(a.data.subject_type) === type).length;
      });
      return row;
    });
  }, [assignments]);

  const totalStarted = chartData.reduce((sum, d) => sum + d.radical + d.kanji + d.vocabulary, 0);

  return (
    <div className={`card ${className}`}>
      <h2>SRS Progress</h2>
      <p className="card__subtitle">{totalStarted.toLocaleString()} items currently in the SRS system</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#34291e" />
          <XAxis dataKey="name" stroke="#a59c8a" />
          <YAxis stroke="#a59c8a" allowDecimals={false} />
          <Tooltip contentStyle={{ background: '#221d17', border: '1px solid #34291e' }} />
          <Legend />
          <Bar dataKey="radical" name="Radicals" stackId="a" fill={TYPE_COLORS.radical} />
          <Bar dataKey="kanji" name="Kanji" stackId="a" fill={TYPE_COLORS.kanji} />
          <Bar dataKey="vocabulary" name="Vocabulary" stackId="a" fill={TYPE_COLORS.vocabulary} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
