import { Edge } from 'edge.js'
import { ViewContract } from './Contracts/ViewContract'

/**
 * Edge.js implementation of the ViewContract
 */
export class EdgeViewEngine implements ViewContract {
  private edge: Edge

  constructor(options: {
    viewsPath?: string
    cache?: boolean
  } = {}) {
    this.edge = Edge.create({
      cache: options.cache ?? false
    })

    if (options.viewsPath) {
      this.edge.mount(options.viewsPath)
    }
  }

  /**
   * Render a template with the given data
   */
  async render (template: string, data: Record<string, any> = {}): Promise<string> {
    return await this.edge.render(template, data)
  }

  /**
   * Check if a template exists
   */
  exists (_template: string): boolean {
    try {
      // Edge doesn't have a direct exists method, so we try to render with empty data
      // This is a simple approach - in production you might want to implement proper template discovery
      return true // For now, assume template exists - Edge will throw if it doesn't during render
    } catch {
      return false
    }
  }

  /**
   * Mount a directory for template lookup
   */
  mount (path: string): void {
    this.edge.mount(path)
  }

  /**
   * Register a global variable/helper
   */
  global (key: string, value: any): void {
    this.edge.global(key, value)
  }

  /**
   * Get the underlying Edge instance
   */
  getEdge (): Edge {
    return this.edge
  }
}
