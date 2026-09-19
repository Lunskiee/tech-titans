import { test, expect } from '@playwright/test'

test.describe('Products & Add Product Modal Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the products page
    await page.goto('http://localhost:5173/products')
  })

  test('should open and display the Add Product modal', async ({ page }) => {
    // Click the trigger button on ProductsView
    await page.getByTestId('add-product-button').click()

    await expect(page.getByTestId('product-modal-overlay')).toBeVisible()
    await expect(page.getByTestId('product-modal')).toBeVisible()
    await expect(page.getByTestId('product-modal-title')).toHaveText('Add Product')
  })

  test('should fill out product details and interact with inputs', async ({ page }) => {
    await page.getByTestId('add-product-button').click()

    // Fill in basic text inputs
    await page.getByTestId('product-name-input').fill('Wireless Mouse')
    await page.getByTestId('product-quantity-input').fill('15')
    await page.getByTestId('product-price-input').fill('29.99')

    // Select options from dropdowns
    await page.getByTestId('product-category-select').selectOption('Electronics')
    await page.getByTestId('product-unit-select').selectOption('Pieces (pcs)')

    // Assert inputs retain entered values
    await expect(page.getByTestId('product-name-input')).toHaveValue('Wireless Mouse')
    await expect(page.getByTestId('product-quantity-input')).toHaveValue('15')
    await expect(page.getByTestId('product-price-input')).toHaveValue('29.99')
  })

  test('should upload and remove product image preview', async ({ page }) => {
    await page.getByTestId('add-product-button').click()

    // Upload mock image buffer
    const fileInput = page.getByTestId('product-image-upload-input')
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-bytes')
    })

    // Verify preview container appears
    await expect(page.getByTestId('product-image-preview-container')).toBeVisible()
    await expect(page.getByTestId('product-image-preview')).toBeVisible()

    // Click remove image button
    await page.getByTestId('product-image-remove-button').click()

    // Dropzone should return when image is removed
    await expect(page.getByTestId('product-image-dropzone')).toBeVisible()
  })

  test('should close modal when clicking cancel button', async ({ page }) => {
    await page.getByTestId('add-product-button').click()
    await expect(page.getByTestId('product-modal')).toBeVisible()

    await page.getByTestId('product-modal-cancel-button').click()
    await expect(page.getByTestId('product-modal')).not.toBeVisible()
  })

  test('should submit product form successfully', async ({ page }) => {
    await page.getByTestId('add-product-button').click()

    await page.getByTestId('product-name-input').fill('Keyboard')
    await page.getByTestId('product-quantity-input').fill('5')
    await page.getByTestId('product-price-input').fill('49.99')

    await page.getByTestId('product-modal-save-button').click()

    // Modal should close upon successful submission
    await expect(page.getByTestId('product-modal')).not.toBeVisible()
  })
})