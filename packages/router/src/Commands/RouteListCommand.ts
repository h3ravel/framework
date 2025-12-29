import { Logger, LoggerChalk, RouteMethod } from '@h3ravel/shared'

import { Application } from '@h3ravel/core'
import { ClassicRouteDefinition } from '@h3ravel/contracts'
import { Command } from '@h3ravel/musket'

export class RouteListCommand extends Command<Application> {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `#route:
        {list : List all registered routes. 
            | {--json : Output the route list as JSON}
            | {--r|reverse : Reverse the ordering of the routes}
        }
    `

    /**
     * The console command description.
     *
     * @var string
     */
    protected description: string = 'List all registered routes.'

    /**
     * Execute the console command.
     */
    public async handle (this: any) {
        console.log('')
        const command = (this.dictionary.baseCommand ?? this.dictionary.name)

        await this[command]()
    }

    /**
     * List all registered routes.
     */
    protected async list () {
        /**
         * Sort the routes alphabetically
         */
        const list = [...(this.app.make('app.routes') as ClassicRouteDefinition[])].sort((a, b) => {
            if (a.path === '/' && b.path !== '/') return -1
            if (b.path === '/' && a.path !== '/') return 1
            return a.path.localeCompare(b.path)
        }).filter(e => !['head', 'patch'].includes(e.method))


        /**
         * Log the route list
         */
        list.forEach(route => {
            const path = route.path === '/'
                ? route.path
                : Logger.log((route.path.slice(1)).split('/').map(e => [
                    (e.includes(':') ? Logger.log('/', 'white', false) : '') + e,
                    e.startsWith(':') ? 'yellow' : 'white'
                ] as [string, LoggerChalk]), '', false)

            const method = (route.method.startsWith('/') ? route.method.slice(1) : route.method).toUpperCase() as RouteMethod
            const name = route.signature[1] ? [route.name ?? '', route.name ? '›' : '', route.signature.join('@')].join(' ') : ''

            const desc = Logger.describe(
                Logger.log(Logger.log(method + this.pair(method), this.color(method), false), 'green', false), path, 15, false
            )
            return Logger.twoColumnDetail(desc.join(''), name)
        })
    }

    /**
     * Get the color
     * 
     * @param method 
     * @returns 
     */
    private color (method: RouteMethod): LoggerChalk {
        switch (method.toLowerCase()) {
            case 'get':
                return 'blue'
            case 'head':
                return 'gray'
            case 'delete':
                return 'red'
            default:
                return 'yellow'
        }
    }

    /**
     * Get the alternate method
     * 
     * @param method 
     * @returns 
     */
    private pair (method: RouteMethod) {
        switch (method.toLowerCase()) {
            case 'get':
                return Logger.log('|', 'gray', false) + Logger.log('HEAD', this.color('HEAD'), false)
            case 'put':
                return Logger.log('|', 'gray', false) + Logger.log('PATCH', this.color('PATCH'), false)
            default:
                return ''
        }
    }
}
