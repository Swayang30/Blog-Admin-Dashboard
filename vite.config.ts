import { defineConfig } from 'vite'

export default defineConfig(async () => {
  let plugins: any[] = []
  if (process.env.VITEST !== 'true') {
    // Only load the React plugin during normal dev/build. Vitest runs in a CJS-like
    // environment and loading some ESM-only plugins can fail, so skip it during tests.
    const { default: react } = await import('@vitejs/plugin-react')
    plugins = [react()]
  }
  return { plugins }
})
