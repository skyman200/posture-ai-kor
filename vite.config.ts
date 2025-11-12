import { defineConfig } from 'vite';

export default defineConfig({
  base: '/posture-ai-kor/',
  
  resolve: {
    alias: {
      '@tensorflow/tfjs': '@tensorflow/tfjs/dist/tf.min.js'
    }
  },
  
  optimizeDeps: {
    exclude: ['@mediapipe/pose'], // CDN으로 직접 로드하므로 번들에서 제외
    include: ['@tensorflow/tfjs'] // TensorFlow.js는 번들에 포함
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
  },
  // HTML 내부 스크립트 파싱 오류 방지를 위한 설정
  assetsInclude: ['**/*.html']
});
