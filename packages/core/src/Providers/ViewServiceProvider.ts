import { Edge } from 'edge.js'
import { ServiceProvider } from '../ServiceProvider'

export class ViewServiceProvider extends ServiceProvider {
    public static priority = 995

    register (): void {
        const config = this.app.make('config')
        const edge = Edge.create({
            cache: process.env.NODE_ENV === 'production'
        })

        edge.mount(this.app.getPath('views'))

        edge.global('asset', this.app.make('asset'))
        edge.global('config', config.get)
        edge.global('app', this.app)

        this.app.bind('edge', () => edge)
    }
}
