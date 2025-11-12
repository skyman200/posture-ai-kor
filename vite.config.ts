import { defineConfig } from 'vite';

export default defineConfig({
  base: '/posture-ai-kor/',
  
  optimizeDeps: {
    exclude: ['@mediapipe/pose'] // CDN으로 직접 로드하므로 번들에서 제외
  },
  
  build: {
    target: 'esnext',
    minify: false, // 디버깅을 위해 minify 비활성화
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: undefined // 수동 청크 분할 비활성화
      }
    }
  }
});
