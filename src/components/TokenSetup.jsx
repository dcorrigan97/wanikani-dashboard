import React, { useState } from 'react';

export default function TokenSetup({ onSubmit }) {
  const [value, setValue] = useState('');

  return (
    <div className="token-setup">
      <h1>WaniKani Dashboard</h1>
      <p>
        Paste your WaniKani API v2 token to get started. Get one from{' '}
        <a href="https://www.wanikani.com/settings/personal_access_tokens" target="_blank" rel="noreferrer">
          wanikani.com/settings/personal_access_tokens
        </a>{' '}
        (read-only scopes are enough).
      </p>
      <p className="token-setup__note">
        The token is stored only in this browser's localStorage — it's never sent anywhere except
        directly to api.wanikani.com.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSubmit(value.trim());
        }}
      >
        <input
          type="password"
          placeholder="WaniKani API token"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <button type="submit" disabled={!value.trim()}>
          Load my data
        </button>
      </form>
    </div>
  );
}
