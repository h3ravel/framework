import type { IApplication } from '@h3ravel/shared'
import { EdgeViewEngine } from '../EdgeViewEngine'

/**
 * View Service Provider
 * 
 * Registers the view engine with the application container
 */
export class ViewServiceProvider {
  public static priority = 995

  constructor(private app: IApplication) {}

  register(): void {
    // Get the application paths and config
    const viewsPath = this.app.getPath?.('views') || 'resources/views'
    const isProduction = process.env.NODE_ENV === 'production'

    // Create the view engine instance
    const viewEngine = new EdgeViewEngine({
      viewsPath,
      cache: isProduction
    })

    // Register global helpers if config is available
    try {
      const config = this.app.make?.('config')
      if (config) {
        viewEngine.global('config', config.get ? config.get.bind(config) : config)
      }
    } catch {
      // Config not available, continue without it
    }

    // Register the app instance if available
    viewEngine.global('app', this.app)

    // Bind the view engine to the container
    this.app.bind('edge', () => viewEngine.getEdge())
    this.app.bind('view', () => async (template: string, data?: Record<string, any>) => {
      return await viewEngine.render(template, data)
    })
  }

  boot(): void {
    // Boot logic if needed
  }
}