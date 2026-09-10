import React from 'react';

export default function CardError({ label, message, onRetry, className = '' }) {
  return (
    <div className={`card card--error ${className}`}>
      <h2>{label}</h2>
      <p className="card__subtitle">Couldn't load this{message ? `: ${message}` : '.'}</p>
      <button onClick={onRetry}>Try again</button>
    </div>
  );
}
