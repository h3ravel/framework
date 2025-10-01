/**
 * Contract for view rendering engines
 */
export interface ViewContract {
  /**
   * Render a template with the given data
   * 
   * @param template - Template name/path
   * @param data - Data to pass to the template
   * @returns Promise resolving to rendered HTML string
   */
  render(template: string, data?: Record<string, any>): Promise<string>

  /**
   * Check if a template exists
   * 
   * @param template - Template name/path
   * @returns True if template exists
   */
  exists(template: string): boolean

  /**
   * Mount a directory for template lookup
   * 
   * @param path - Path to mount
   */
  mount(path: string): void

  /**
   * Register a global variable/helper
   * 
   * @param key - Global variable name
   * @param value - Value or function
   */
  global(key: string, value: any): void
}