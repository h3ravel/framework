import { Edge } from 'edge.js'
import { ServiceProvider } from '@h3ravel/core'

export class ViewServiceProvider extends ServiceProvider {
    register (): void {
        const config = this.app.make('config')
        const edge = Edge.create({
            cache: process.env.NODE_ENV === 'production'
        })

        edge.mount(this.app.getPath('views'))

        edge.global('asset', this.app.make('asset'))
        edge.global('config', config.get)
        edge.global('app', this.app)

        this.app.bind('view', () => edge)
    }
}
