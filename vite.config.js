import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' → 로컬 파일/임의 서브경로(GitHub Pages 프로젝트 페이지) 어디서나 동작
export default defineConfig({
  base: './',
  plugins: [react()],
})
