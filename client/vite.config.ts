import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  //배포용
  server: {
    fs: {
      strict: false,
    },
  },
  base: '/client/',
  //
  plugins: [react()],
  build: {
    outDir: 'public'}
})
