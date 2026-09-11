// Only the token and history are backed up. Everything else (assignments,
// subjects, review stats) refetches fine from WaniKani's API — the token
// and the local history snapshots are the only things that are actually
// irreplaceable if this device's storage gets wiped.
const BACKUP_KEYS = ['wk_api_token', 'wk_history_v1'];

export function exportBackup() {
  const payload = {};
  BACKUP_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) payload[key] = value;
  });
  payload.exportedAt = new Date().toISOString();

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wanikani-dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        let restored = 0;
        BACKUP_KEYS.forEach((key) => {
          if (typeof payload[key] === 'string') {
            localStorage.setItem(key, payload[key]);
            restored++;
          }
        });
        if (restored === 0) {
          reject(new Error('That file doesn\u2019t look like a dashboard backup.'));
          return;
        }
        resolve();
      } catch (err) {
        reject(new Error('Could not read that file as a backup.'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
