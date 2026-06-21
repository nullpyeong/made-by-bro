import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 배포: Vercel 루트(/) 기준. base 변경 필요 시 여기서.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
