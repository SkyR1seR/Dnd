import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' — сборку можно разместить в любой папке (например, на GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
})
