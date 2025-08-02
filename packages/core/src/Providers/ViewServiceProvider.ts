import { Edge } from 'edge.js'
import { ServiceProvider } from '@h3ravel/core'

export class ViewServiceProvider extends ServiceProvider {
    register (): void {
        const edge = Edge.create({
            cache: process.env.NODE_ENV === 'production'
        })

        edge.mount(this.app.getPath('views'))

        this.app.bind('view', () => edge)
    }
}
