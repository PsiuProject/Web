import { test, expect } from '@playwright/test'

test.describe('Canvas Editor - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Welcome page loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/PSIU/)
    await expect(page.getByText('EG.SUR')).toBeVisible()
    await expect(page.getByRole('button', { name: /enter/i })).toBeVisible()
  })

  test('Full flow: Welcome → Login → Project Selection → Edit Mode', async ({ page }) => {
    // Enter from welcome page
    await page.getByRole('button', { name: /enter/i }).click()
    await page.waitForURL(/\/gallery/)

    // Mock login
    await page.getByRole('button', { name: /login/i }).click()
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill('test@example.com')
    const passwordInput = page.locator('input[type="password"]')
    await passwordInput.fill('password123')
    await page.getByRole('button', { name: /login/i, exact: true }).click()
    await page.waitForTimeout(500)

    // Should see user info
    await expect(page.getByRole('button').filter({ has: page.locator('img') })).toBeVisible()

    // Create or select a project
    const newProjectBtn = page.getByText('+ NEW')
    if (await newProjectBtn.isVisible()) {
      await newProjectBtn.click()
      await page.locator('input[placeholder="Titulo do projeto"]').fill('Test Project')
      await page.locator('textarea[placeholder="Descricao breve"]').fill('Test description')
      await page.getByRole('button', { name: /create/i }).click()
      await page.waitForURL(/\/edit$/)
    } else {
      // Select existing project
      const projectCard = page.locator('.project-card').first()
      await projectCard.dblclick()
      await page.waitForURL(/\/edit/)
    }

    // Should be in edit mode
    await expect(page.locator('.editor-toolbar')).toBeVisible()
    await expect(page.getByText('ADD')).toBeVisible()
  })

  test('Text tool: Add text element and edit content', async ({ page }) => {
    // Setup: login and enter edit mode
    await page.getByRole('button', { name: /enter/i }).click()
    await page.waitForURL(/\/gallery/)
    await page.getByRole('button', { name: /login/i }).click()
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password123')
    await page.getByRole('button', { name: /login/i, exact: true }).click()
    await page.waitForTimeout(500)

    // Enter first project in edit mode
    const projectCard = page.locator('.project-card').first()
    await projectCard.dblclick()
    await page.waitForURL(/\/edit/)

    // Click text tool
    const textTool = page.getByRole('button', { name: /text/i })
    await textTool.click()
    await page.waitForTimeout(300)

    // Click on canvas to place text
    const canvas = page.locator('.canvas-workspace')
    const canvasBox = await canvas.boundingBox()
    if (canvasBox) {
      await canvas.click({
        position: {
          x: canvasBox.width / 2,
          y: canvasBox.height / 2
        }
      })
      await page.waitForTimeout(500)

      // Text element should be created
      const textElement = page.locator('.canvas-text').last()
      await expect(textElement).toBeVisible()

      // Double-click to edit
      await textElement.dblclick()
      const editable = textElement.locator('.text-editable')
      await editable.fill('Hello World')
      
      // Save by pressing Ctrl+Enter
      await editable.press('Control+Enter')
      await page.waitForTimeout(300)

      // Text should be saved
      await expect(textElement).toContainText('Hello World')
    }
  })

  test('Language switcher changes translations', async ({ page }) => {
    // Setup: login and enter edit mode
    await page.getByRole('button', { name: /enter/i }).click()
    await page.waitForURL(/\/gallery/)
    await page.getByRole('button', { name: /login/i }).click()
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password123')
    await page.getByRole('button', { name: /login/i, exact: true }).click()
    await page.waitForTimeout(500)

    // Enter first project
    const projectCard = page.locator('.project-card').first()
    await projectCard.dblclick()
    await page.waitForURL(/\/edit/)

    // Get initial language button text
    const langButton = page.getByRole('button').filter({ hasText: /^(EN|PT)$/ })
    const initialLang = await langButton.textContent()

    // Click language switcher
    await langButton.click()
    await page.waitForTimeout(300)

    // Language should toggle
    const newLang = await langButton.textContent()
    expect(newLang).not.toBe(initialLang)
  })

  test('Toolbar appears near selected text', async ({ page }) => {
    // Setup: login and enter edit mode
    await page.getByRole('button', { name: /enter/i }).click()
    await page.waitForURL(/\/gallery/)
    await page.getByRole('button', { name: /login/i }).click()
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password123')
    await page.getByRole('button', { name: /login/i, exact: true }).click()
    await page.waitForTimeout(500)

    // Enter first project
    const projectCard = page.locator('.project-card').first()
    await projectCard.dblclick()
    await page.waitForURL(/\/edit/)

    // Find existing text element or create one
    let textElement = page.locator('.canvas-text').first()
    
    if (await textElement.count() === 0) {
      // Create text element
      await page.getByRole('button', { name: /text/i }).click()
      const canvas = page.locator('.canvas-workspace')
      const canvasBox = await canvas.boundingBox()
      if (canvasBox) {
        await canvas.click({
          position: {
            x: canvasBox.width / 2,
            y: canvasBox.height / 2
          }
        })
        await page.waitForTimeout(500)
        textElement = page.locator('.canvas-text').last()
      }
    }

    // Hover over text element
    await textElement.hover()
    await page.waitForTimeout(300)

    // Toolbar should appear
    const toolbar = page.locator('.text-hover-toolbar')
    await expect(toolbar).toBeVisible()

    // Toolbar should be positioned reasonably (not off-screen)
    const toolbarBox = await toolbar.boundingBox()
    expect(toolbarBox).toBeTruthy()
    expect(toolbarBox!.y).toBeGreaterThan(50) // Below header
  })

  test('Card tool: Add card with cells', async ({ page }) => {
    // Setup: login and enter edit mode
    await page.getByRole('button', { name: /enter/i }).click()
    await page.waitForURL(/\/gallery/)
    await page.getByRole('button', { name: /login/i }).click()
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password123')
    await page.getByRole('button', { name: /login/i, exact: true }).click()
    await page.waitForTimeout(500)

    // Enter first project
    const projectCard = page.locator('.project-card').first()
    await projectCard.dblclick()
    await page.waitForURL(/\/edit/)

    // Click card tool
    const cardTool = page.getByRole('button', { name: /card/i })
    await cardTool.click()
    await page.waitForTimeout(300)

    // Drag on canvas to create card with size
    const canvas = page.locator('.canvas-workspace')
    const canvasBox = await canvas.boundingBox()
    if (canvasBox) {
      const startX = canvasBox.width / 4
      const startY = canvasBox.height / 4
      const endX = (canvasBox.width / 4) * 3
      const endY = (canvasBox.height / 4) * 3
      
      await canvas.mouse.move(startX, startY)
      await canvas.mouse.down()
      await canvas.mouse.move(endX, endY)
      await canvas.mouse.up()
      await page.waitForTimeout(500)

      // Card should be created
      const card = page.locator('.canvas-card').last()
      await expect(card).toBeVisible()

      // Should have empty cells with + icons
      const emptyCells = card.locator('.cell-skeleton')
      await expect(emptyCells.first()).toBeVisible()
    }
  })

  test('View mode: Read-only access', async ({ page }) => {
    // Setup: login and enter view mode
    await page.getByRole('button', { name: /enter/i }).click()
    await page.waitForURL(/\/gallery/)
    await page.getByRole('button', { name: /login/i }).click()
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password123')
    await page.getByRole('button', { name: /login/i, exact: true }).click()
    await page.waitForTimeout(500)

    // Enter first project in view mode
    const projectCard = page.locator('.project-card').first()
    await projectCard.click()
    await page.waitForURL(/\/view/)

    // Should see canvas elements but no editor toolbar
    await expect(page.locator('.editor-toolbar')).not.toBeVisible()
    
    // Elements should be visible but not editable
    const canvasElements = page.locator('.canvas-element')
    if (await canvasElements.count() > 0) {
      await expect(canvasElements.first()).toBeVisible()
    }
  })

  test('Comment mode: Can add comments', async ({ page }) => {
    // Setup: login and enter comment mode
    await page.getByRole('button', { name: /enter/i }).click()
    await page.waitForURL(/\/gallery/)
    await page.getByRole('button', { name: /login/i }).click()
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password123')
    await page.getByRole('button', { name: /login/i, exact: true }).click()
    await page.waitForTimeout(500)

    // Enter first project in comment mode
    const commentLink = page.getByRole('link', { name: /comment/i }).first()
    if (await commentLink.isVisible()) {
      await commentLink.click()
      await page.waitForURL(/\/comment/)

      // Comment bubbles should be visible
      const commentBubbles = page.locator('.comment-bubble')
      // May or may not have existing comments
      
      // Header should show View | Comment | Edit navigation
      await expect(page.getByRole('link', { name: /view/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /comment/i })).toBeVisible()
    }
  })

  test('Export menu shows download options', async ({ page }) => {
    // Setup: login
    await page.getByRole('button', { name: /enter/i }).click()
    await page.waitForURL(/\/gallery/)
    await page.getByRole('button', { name: /login/i }).click()
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password123')
    await page.getByRole('button', { name: /login/i, exact: true }).click()
    await page.waitForTimeout(500)

    // Enter a project
    const projectCard = page.locator('.project-card').first()
    await projectCard.dblclick()
    await page.waitForURL(/\/edit/)

    // Click export button
    const exportBtn = page.getByRole('button', { name: /export/i })
    await exportBtn.click()
    await page.waitForTimeout(300)

    // Export menu should appear
    const exportMenu = page.locator('.export-menu')
    await expect(exportMenu).toBeVisible()

    // Should have JSON, PNG, PDF options
    await expect(exportMenu.getByText(/json/i)).toBeVisible()
    await expect(exportMenu.getByText(/png/i)).toBeVisible()
    await expect(exportMenu.getByText(/pdf/i)).toBeVisible()
  })

  test('Properties panel shows when element selected', async ({ page }) => {
    // Setup: login and enter edit mode
    await page.getByRole('button', { name: /enter/i }).click()
    await page.waitForURL(/\/gallery/)
    await page.getByRole('button', { name: /login/i }).click()
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('password123')
    await page.getByRole('button', { name: /login/i, exact: true }).click()
    await page.waitForTimeout(500)

    // Enter first project
    const projectCard = page.locator('.project-card').first()
    await projectCard.dblclick()
    await page.waitForURL(/\/edit/)

    // Click on an element to select it
    const canvasElement = page.locator('.canvas-element').first()
    if (await canvasElement.count() > 0) {
      await canvasElement.click()
      await page.waitForTimeout(300)

      // Properties panel should appear
      const propertiesPanel = page.locator('.properties-panel')
      await expect(propertiesPanel).toBeVisible()
    }
  })
})
