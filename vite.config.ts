import { defineConfig } from 'vite';

export default defineConfig({
  base: '/posture-ai-kor/',
  build: {
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
});
