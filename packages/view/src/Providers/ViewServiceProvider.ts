import { EdgeViewEngine } from '../EdgeViewEngine'
import { ServiceProvider } from '@h3ravel/core'

/**
 * View Service Provider
 * 
 * Registers the view engine with the application container
 */
export class ViewServiceProvider extends ServiceProvider {
  public static priority = 995

  async register () {
    // Create the view engine instance
    const viewEngine = new EdgeViewEngine({
      viewsPath: this.app.getPath('views'),
      cache: process.env.NODE_ENV === 'production'
    })

    // Register the app instance if available
    viewEngine.global('app', this.app)

    const edge = viewEngine.getEdge()

    /**
     * Bind the view engine to the container
     */
    this.app.bind('edge', () => edge)
  }

  async boot () {
    /**
     * Initialize the view handler method
     * 
     * @param template 
     * @param params 
     * @returns 
     */
    const view = async (template: string, data?: Record<string, any>) => {
      const response = this.app.make('http.response')

      return response.html(await this.app.make('edge').render(template, data))
    }

    /**
     * Bind the view method to the global variable space
     */
    globalThis.view = view

    /**
     * Dynamically bind the view renderer to the service container.
     * This allows any part of the request lifecycle to render templates using Edge.
     */
    this.app.bind('view', () => view)
  }
}
