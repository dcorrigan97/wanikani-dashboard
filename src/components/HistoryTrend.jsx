import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function HistoryTrend({ progressHistory }) {
  const hasEnoughData = progressHistory.length >= 2;

  return (
    <div className="card">
      <h2>Progress Over Time</h2>
      <p className="card__subtitle">
        {hasEnoughData
          ? `Tracking since ${progressHistory[0].date}`
          : 'First snapshot saved today — this fills in the more you open the app'}
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={progressHistory} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="date" stroke="#999" />
          <YAxis stroke="#999" allowDecimals={false} />
          <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #333' }} />
          <Legend />
          <Line type="monotone" dataKey="started" name="Items started" stroke="#0093dd" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="burned" name="Burned" stroke="#dd0093" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
      <p className="card__footnote">
        WaniKani's API doesn't expose historical trend data, so this chart is built from a snapshot saved locally
        each time you open the dashboard — it only knows about days you've actually opened this app on this device.
      </p>
    </div>
  );
}
