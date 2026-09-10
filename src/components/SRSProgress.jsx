import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// WaniKani srs_stage: 0 = not started, 1-4 = Apprentice, 5-6 = Guru,
// 7 = Master, 8 = Enlightened, 9 = Burned.
const BUCKETS = [
  { label: 'Apprentice', stages: [1, 2, 3, 4], color: '#dd0093' },
  { label: 'Guru', stages: [5, 6], color: '#882d9e' },
  { label: 'Master', stages: [7], color: '#294ddb' },
  { label: 'Enlightened', stages: [8], color: '#0093dd' },
  { label: 'Burned', stages: [9], color: '#434343' },
];

export default function SRSProgress({ assignments }) {
  const chartData = useMemo(() => {
    const started = assignments.filter((a) => a.data.started_at && !a.data.hidden);
    return BUCKETS.map((bucket) => ({
      name: bucket.label,
      count: started.filter((a) => bucket.stages.includes(a.data.srs_stage)).length,
      color: bucket.color,
    }));
  }, [assignments]);

  const totalStarted = chartData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="card">
      <h2>SRS Progress</h2>
      <p className="card__subtitle">{totalStarted.toLocaleString()} items currently in the SRS system</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="name" stroke="#999" />
          <YAxis stroke="#999" allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#1e1e1e', border: '1px solid #333' }}
            formatter={(value) => [value.toLocaleString(), 'items']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
