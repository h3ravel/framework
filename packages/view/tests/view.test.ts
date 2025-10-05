import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'

import { EdgeViewEngine } from '../src/EdgeViewEngine'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('EdgeViewEngine', () => {
  let tempDir: string
  let viewEngine: EdgeViewEngine

  beforeEach(async () => {
    // Create a temporary directory for test templates
    tempDir = await mkdtemp(join(tmpdir(), 'h3ravel-view-test-'))

    // Create a test template
    await writeFile(
      join(tempDir, 'test.edge'),
      '<h1>Hello {{ name }}!</h1>'
    )

    // Initialize view engine
    viewEngine = new EdgeViewEngine({
      viewsPath: tempDir,
      cache: false
    })
  })

  afterEach(async () => {
    // Clean up temp directory
    await rm(tempDir, { recursive: true, force: true })
  })

  it('should render a simple template', async () => {
    const result = await viewEngine.render('test', { name: 'World' })
    expect(result.trim()).toBe('<h1>Hello World!</h1>')
  })

  it('should handle missing data gracefully', async () => {
    const result = await viewEngine.render('test', {})
    // Edge.js renders undefined values as 'undefined' string
    expect(result.trim()).toBe('<h1>Hello undefined!</h1>')
  })

  it('should register global variables', async () => {
    // Create a template that uses globals
    await writeFile(
      join(tempDir, 'global.edge'),
      '<p>App: {{ appName }}</p>'
    )

    viewEngine.global('appName', 'H3ravel')

    const result = await viewEngine.render('global', {})
    expect(result.trim()).toBe('<p>App: H3ravel</p>')
  })

  it('should mount additional directories', async () => {
    // Create another temp directory
    const tempDir2 = await mkdtemp(join(tmpdir(), 'h3ravel-view-test2-'))

    try {
      await writeFile(
        join(tempDir2, 'mounted.edge'),
        '<div>{{ message }}</div>'
      )

      viewEngine.mount(tempDir2)

      const result = await viewEngine.render('mounted', { message: 'Success' })
      expect(result.trim()).toBe('<div>Success</div>')
    } finally {
      await rm(tempDir2, { recursive: true, force: true })
    }
  })
})
