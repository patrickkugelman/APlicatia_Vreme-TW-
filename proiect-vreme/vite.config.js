import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  test: {
    environment: 'jsdom',
    environmentMatchGlobs: [
      ['server/tests/**', 'node']
    ],
    include: ['tests/**/*.test.js', 'server/tests/**/*.test.js']
  }
});
