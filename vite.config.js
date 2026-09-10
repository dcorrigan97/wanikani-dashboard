import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' keeps built asset paths relative, so this works whether it's
// served from a user/org root page or a project page (username.github.io/repo-name/).
// If you deploy to a project page and hit blank-page issues, hardcode
// base: '/repo-name/' instead.
export default defineConfig({
  plugins: [react()],
  base: './',
});
