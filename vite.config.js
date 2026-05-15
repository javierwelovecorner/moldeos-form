import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Force rebuild - v2
export default defineConfig({ plugins: [react()] })
