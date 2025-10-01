import { ServiceProvider } from '../ServiceProvider'

export class ViewServiceProvider extends ServiceProvider {
    public static priority = 995

    register (): void {
        // Try to load the view package if available
        try {
            const { EdgeViewEngine } = require('@h3ravel/view')
            
            const config = this.app.make('config')
            const viewEngine = new EdgeViewEngine({
                viewsPath: this.app.getPath('views'),
                cache: process.env.NODE_ENV === 'production'
            })

            viewEngine.global('config', config.get)
            viewEngine.global('app', this.app)

            this.app.bind('edge', () => viewEngine.getEdge())
        } catch (error) {
            // View package not available - provide stub implementations
            console.warn('[@h3ravel/core] View package not found. Install @h3ravel/view for template rendering support.')
            
            // Bind stub implementations to satisfy the contract
            this.app.bind('edge', () => {
                throw new Error('View engine not available. Install @h3ravel/view package.')
            })
        }
    }
}