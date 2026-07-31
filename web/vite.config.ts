import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  if (!env.VITE_API_URL) {
    throw new Error('VITE_API_URL environment variable is required')
  }

  return {
    plugins: [react()],
  }
})
