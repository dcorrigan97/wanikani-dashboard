import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function daysBetween(a, b) {
  return Math.max(0, (new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
}

export default function LevelProgression({ levelProgressions }) {
  const chartData = useMemo(() => {
    return levelProgressions
      .filter((lp) => lp.data.started_at)
      .sort((a, b) => a.data.level - b.data.level)
      .map((lp) => {
        const end = lp.data.passed_at || lp.data.completed_at;
        const inProgress = !end;
        const days = end
          ? daysBetween(lp.data.started_at, end)
          : daysBetween(lp.data.started_at, new Date().toISOString());
        return {
          level: `Lv ${lp.data.level}`,
          days: Math.round(days * 10) / 10,
          inProgress,
        };
      });
  }, [levelProgressions]);

  const completedDays = chartData.filter((d) => !d.inProgress).map((d) => d.days);
  const avg = completedDays.length
    ? Math.round((completedDays.reduce((a, b) => a + b, 0) / completedDays.length) * 10) / 10
    : 0;

  return (
    <div className="card">
      <h2>Level Progression</h2>
      <p className="card__subtitle">
        {completedDays.length} level{completedDays.length === 1 ? '' : 's'} completed · avg {avg} days/level
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="level" stroke="#999" interval={Math.ceil(chartData.length / 15)} />
          <YAxis stroke="#999" label={{ value: 'days', angle: -90, position: 'insideLeft', fill: '#999' }} />
          <Tooltip
            contentStyle={{ background: '#1e1e1e', border: '1px solid #333' }}
            formatter={(value, name, props) => [
              `${value} days${props.payload.inProgress ? ' (in progress)' : ''}`,
              'duration',
            ]}
          />
          <Bar dataKey="days" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.inProgress ? '#0093dd' : '#dd0093'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
