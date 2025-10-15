import { mkdir, writeFile } from 'node:fs/promises'

import { Command } from '@h3ravel/musket'
import { dirname } from 'node:path'

/**
 * Command to create new view files
 */
export class MakeViewCommand extends Command {
  /**
   * Create a new view file
   * 
   * @param name - View name (can include directories like 'auth/login')
   * @param options - Command options
   */
  static async make (
    name: string,
    options: {
      force?: boolean
      basePath?: string
    } = {}
  ): Promise<void> {
    const { force = false, basePath = 'src/resources/views' } = options

    const path = `${basePath}/${name}.edge`

    // The view is scoped to a path make sure to create the associated directories
    if (name.includes('/')) {
      await mkdir(dirname(path), { recursive: true })
    }

    // Check if the view already exists
    if (!force) {
      try {
        const { FileSystem } = await import('@h3ravel/shared')
        if (await FileSystem.fileExists(path)) {
          throw new Error(`View ${name} already exists`)
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          throw error
        }
        // FileSystem not available, continue
      }
    }

    // Create the view file
    const content = `{{-- ${path} --}}
<div>
  <!-- Your view content here -->
  <h1>{{ title ?? 'Welcome' }}</h1>
</div>`

    await writeFile(path, content)
  }
}
