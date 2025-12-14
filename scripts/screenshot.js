const { chromium } = require('playwright');

const urls = ['http://127.0.0.1:5173', 'http://localhost:5173']
const out = 'screenshot.png'

async function waitAndScreenshot(retries = 20) {
  for (let i = 0; i < retries; i++) {
    for (const url of urls) {
      try {
        const browser = await chromium.launch({ args: ['--no-sandbox'] })
        const page = await browser.newPage()
        await page.goto(url, { waitUntil: 'load', timeout: 15000 })
        await page.screenshot({ path: out, fullPage: true })
        await browser.close()
        console.log('Screenshot saved to', out, 'from', url)
        return
      } catch (e) {
        console.log('Attempt', i + 1, 'failed for', url, '-', e.message)
        // continue to next url
      }
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  console.error('Failed to capture screenshot - server may not be ready')
  process.exit(1)
}

waitAndScreenshot()
