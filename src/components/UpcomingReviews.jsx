import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HOURS_AHEAD = 24;

export default function UpcomingReviews({ assignments }) {
  const { dueNow, buckets, totalNext24h } = useMemo(() => {
    const now = new Date();
    let dueNow = 0;
    const counts = new Array(HOURS_AHEAD).fill(0);

    assignments.forEach((a) => {
      if (!a.data.available_at || a.data.hidden) return;
      const availableAt = new Date(a.data.available_at);
      const diffHours = (availableAt - now) / (1000 * 60 * 60);
      if (diffHours <= 0) {
        dueNow++;
        return;
      }
      const hourIndex = Math.floor(diffHours);
      if (hourIndex < HOURS_AHEAD) counts[hourIndex]++;
    });

    const buckets = counts.map((count, i) => ({ hour: `+${i + 1}h`, count }));
    const totalNext24h = counts.reduce((sum, c) => sum + c, 0);

    return { dueNow, buckets, totalNext24h };
  }, [assignments]);

  return (
    <>
      <h2>Upcoming Reviews</h2>
      <p className="card__subtitle">
        {dueNow.toLocaleString()} due right now · {totalNext24h.toLocaleString()} more in the next 24h
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={buckets} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#34291e" />
          <XAxis dataKey="hour" stroke="#a59c8a" interval={2} />
          <YAxis stroke="#a59c8a" allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#221d17', border: '1px solid #34291e' }}
            allowEscapeViewBox={{ x: true, y: true }}
            position={{ y: -10 }}
            wrapperStyle={{ zIndex: 100 }}
            cursor={false}
            formatter={(value) => [value, 'reviews']}
          />
          <Bar dataKey="count" fill="#8da4c2" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}
