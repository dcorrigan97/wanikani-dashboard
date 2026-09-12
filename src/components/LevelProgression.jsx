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
    <>
      <h2>Level Progression</h2>
      <p className="card__subtitle">
        {completedDays.length} level{completedDays.length === 1 ? '' : 's'} completed · avg {avg} days/level
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#34291e" />
          <XAxis dataKey="level" stroke="#a59c8a" interval={Math.ceil(chartData.length / 15)} />
          <YAxis stroke="#a59c8a" label={{ value: 'days', angle: -90, position: 'insideLeft', fill: '#a59c8a' }} />
          <Tooltip
            contentStyle={{ background: '#221d17', border: '1px solid #34291e' }}
            formatter={(value, name, props) => [
              `${value} days${props.payload.inProgress ? ' (in progress)' : ''}`,
              'duration',
            ]}
          />
          <Bar dataKey="days" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.inProgress ? '#8da4c2' : '#d9ae3e'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
