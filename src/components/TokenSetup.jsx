import React, { useRef, useState } from 'react';
import { importBackup } from '../utils/backup.js';

export default function TokenSetup({ onSubmit }) {
  const [value, setValue] = useState('');
  const [restoreStatus, setRestoreStatus] = useState(null); // null | 'success' | 'error'
  const [restoreMessage, setRestoreMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleRestoreFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importBackup(file);
      setRestoreStatus('success');
      setRestoreMessage('Restored — reloading…');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setRestoreStatus('error');
      setRestoreMessage(err.message || 'Could not restore that file.');
    }
    e.target.value = '';
  };

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

      <div className="token-setup__restore">
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Restore from backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleRestoreFile}
        />
        {restoreMessage && (
          <p className={restoreStatus === 'error' ? 'status-message--error' : 'token-setup__note'}>
            {restoreMessage}
          </p>
        )}
      </div>
    </div>
  );
}
