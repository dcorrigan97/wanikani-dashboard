import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function HistoryTrend({ progressHistory, onEditEntry, onDeleteEntry }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ date: yesterdayKey(), started: '', burned: '' });

  const hasEnoughData = progressHistory.length >= 2;

  const loadRowIntoForm = (entry) => {
    setForm({ date: entry.date, started: String(entry.started ?? ''), burned: String(entry.burned ?? '') });
    setEditing(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.date) return;
    onEditEntry(form.date, {
      started: Number(form.started) || 0,
      burned: Number(form.burned) || 0,
    });
    setForm({ date: yesterdayKey(), started: '', burned: '' });
  };

  const recent = [...progressHistory].reverse().slice(0, 10);

  return (
    <>
      <h2>Progress Over Time</h2>
      <p className="card__subtitle">
        {hasEnoughData
          ? `Tracking since ${progressHistory[0].date}`
          : 'First snapshot saved today — this fills in the more you open the app'}
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={progressHistory} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#34291e" />
          <XAxis dataKey="date" stroke="#a59c8a" />
          <YAxis stroke="#a59c8a" allowDecimals={false} />
          <Tooltip contentStyle={{ background: '#221d17', border: '1px solid #34291e' }}
            allowEscapeViewBox={{ x: true, y: true }}
            position={{ y: -10 }}
            wrapperStyle={{ zIndex: 100 }} />
          <Legend />
          <Line type="monotone" dataKey="started" name="Items started" stroke="#8da4c2" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="burned" name="Burned" stroke="#e2604f" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>

      <button className="expand-toggle" onClick={() => setEditing((e) => !e)}>
        {editing ? '▴ Hide edit history' : '▾ Edit history'}
      </button>

      {editing && (
        <div className="history-edit">
          <form className="history-edit__form" onSubmit={handleSave}>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
            <input
              type="number"
              placeholder="Items started"
              value={form.started}
              onChange={(e) => setForm((f) => ({ ...f, started: e.target.value }))}
              min="0"
            />
            <input
              type="number"
              placeholder="Burned"
              value={form.burned}
              onChange={(e) => setForm((f) => ({ ...f, burned: e.target.value }))}
              min="0"
            />
            <button type="submit">Save</button>
          </form>

          {recent.length > 0 && (
            <div className="history-edit__list">
              {recent.map((entry) => (
                <div className="history-edit__row" key={entry.date}>
                  <span onClick={() => loadRowIntoForm(entry)}>
                    {entry.date} · started {entry.started ?? 0} · burned {entry.burned ?? 0}
                  </span>
                  <button className="history-edit__delete" onClick={() => onDeleteEntry(entry.date)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="card__footnote">
        WaniKani's API doesn't expose historical trend data, so this chart is built from a snapshot saved locally
        each time you open the dashboard — it only knows about days you've actually opened this app on this device.
      </p>
    </>
  );
}
