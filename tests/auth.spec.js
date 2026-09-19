import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigates directly to your local dev server running on port 5173
    await page.goto('http://localhost:5173/')
  })

  test('should display all login form elements', async ({ page }) => {
    await expect(page.getByTestId('login-form')).toBeVisible()
    await expect(page.getByTestId('login-email-input')).toBeVisible()
    await expect(page.getByTestId('login-password-input')).toBeVisible()
    await expect(page.getByTestId('login-submit-button')).toBeVisible()
    await expect(page.getByTestId('login-forgot-password-link')).toBeVisible()
    await expect(page.getByTestId('login-signup-link')).toBeVisible()
  })

  test('should toggle password field visibility when eye icon is clicked', async ({ page }) => {
    const passwordInput = page.getByTestId('login-password-input')
    const toggleButton = page.getByTestId('login-toggle-password-button')

    await expect(passwordInput).toHaveAttribute('type', 'password')

    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should successfully fill form and redirect to products page', async ({ page }) => {
    await page.getByTestId('login-email-input').fill('admin@vaulto.com')
    await page.getByTestId('login-password-input').fill('password123')
    await page.getByTestId('login-submit-button').click()

    await expect(page).toHaveURL('http://localhost:5173/products')
  })

  test('should navigate to signup page when link is clicked', async ({ page }) => {
    await page.getByTestId('login-signup-link').click()
    await expect(page).toHaveURL('http://localhost:5173/signup')
  })

  test('should navigate to forgot password page when link is clicked', async ({ page }) => {
    await page.getByTestId('login-forgot-password-link').click()
    await expect(page).toHaveURL('http://localhost:5173/forgot-password')
  })
})