import { test, expect } from '@playwright/test'

test('create, edit, delete blog', async ({ page }) => {
  await page.goto('/')
  await page.click('text=New Blog')
  await page.fill('input[placeholder="Title"]', 'E2E Test Blog')
  await page.fill('textarea[placeholder="Markdown content"]', 'This is a test blog created by Playwright.')
  await page.click('text=Save')
  await page.waitForSelector('text=E2E Test Blog')
  await expect(page.locator('text=E2E Test Blog')).toHaveCount(1)

  // Edit
  await page.click('tr:has-text("E2E Test Blog") >> text=Edit')
  await page.fill('input[placeholder="Title"]', 'E2E Test Blog - Edited')
  await page.click('text=Save')
  await page.waitForSelector('text=E2E Test Blog - Edited')

  // Delete
  page.on('dialog', (dialog) => dialog.accept())
  await page.click('tr:has-text("E2E Test Blog - Edited") >> text=Delete')
  await expect(page.locator('text=E2E Test Blog - Edited')).toHaveCount(0)
})