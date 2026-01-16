import { IApplication, IRoute, RouteMethod } from '@h3ravel/contracts'
import { Logger, LoggerChalk } from '@h3ravel/shared'

import { Command } from '@h3ravel/musket'

export class RouteListCommand extends Command<IApplication> {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature: string = `#route:
        {list : List all registered routes. 
            | {--json : Output the route list as JSON}
            | {--r|reverse : Reverse the ordering of the routes}
            | {--s|sort=uri : Sort the routes by a given column (uri, name, method)}
            | {--m|method= : Filter the routes by a specific HTTP method}
            | {--n|name= : Filter the routes by a specific name}
            | {--p|path= : Filter the routes by a specific path}
            | {--e|except-path= : Exclude routes with a specific path}
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
    public async handle () {

        this.newLine()

        if (!this.app.make('router').getRoutes().count()) {
            this.error('ERROR: Your application doesn\'t have any routes.').newLine()
            return
        }

        const routes = this.getRoutes()
        if (routes.length === 0) {
            this.error('ERROR: Your application doesn\'t have any routes matching the given criteria.').newLine()
            return
        }
        await this.showRoutes(routes)
    }

    /**
     * Compile the routes into a displayable format.
     */
    protected getRoutes () {
        /**
         * Sort the routes alphabetically
         */
        const list = this.app.make('router').getRoutes().getRoutes().sort((a, b) => {
            if (a.path === '/' && b.path !== '/') return -1
            if (b.path === '/' && a.path !== '/') return 1
            return a.path.localeCompare(b.path)
        })

        if (this.option('reverse')) {
            list.reverse()
        }

        if (this.option('sort')) {
            const sort = this.option('sort')!.toLowerCase()
            list.sort((a, b) => {
                switch (sort) {
                    case 'uri':
                        return a.path.localeCompare(b.path)
                    case 'name':
                        return (a.getName() ?? '').localeCompare(b.getName() ?? '')
                    case 'method':
                        return a.methods.join('|').localeCompare(b.methods.join('|'))
                    default:
                        return 0
                }
            })
        }

        if (this.option('method')) {
            const method = this.option('method')!.toUpperCase()
            list.splice(0, list.length, ...list.filter(route => route.getMethods().includes(method as RouteMethod)))
        }

        if (this.option('name')) {
            const name = this.option('name')!
            list.splice(0, list.length, ...list.filter(route => route.getName() === name))
        }

        if (this.option('path')) {
            const path = this.option('path')!
            list.splice(0, list.length, ...list.filter(route => route.path === path))
        }

        if (this.option('except-path')) {
            const path = this.option('except-path')!
            list.splice(0, list.length, ...list.filter(route => route.path !== path))
        }

        return list
    }

    /**
     * List all registered routes.
     */
    protected async showRoutes (list: IRoute[]) {
        if (this.option('json')) {
            return this.asJson(list)
        }

        return this.forCli(list)
    }

    private forCli (list: IRoute[]) {
        /**
         * Log the route list
         */
        list.forEach(route => {
            const uri = route.uri()
            const name = route.getName() ?? ''
            const formatedPath = uri === '/'
                ? uri
                : uri
                    .split('/')
                    .map(e => [e, /\{.*\}/.test(e) ? 'yellow' : 'white'] as [string, LoggerChalk])
                    .reduce((acc, [segment, color], i) => {
                        return acc + (i > 0 ? Logger.log('/', 'white', false) : '') + Logger.log(segment, color, false)
                    }, '')


            const formatedMethod = route.getMethods().map(method => Logger.log(method, this.color(method), false)).join(Logger.log('|', 'gray', false))
            const formatedName = route.action.controller ? [name, name !== '' ? '›' : '', route.action.controller].join(' ') : name
            const desc = Logger.describe(Logger.log(formatedMethod, 'green', false), formatedPath, 15, false)
            return Logger.twoColumnDetail(desc.join(''), formatedName)
        })

        this.newLine(2)
        Logger.split('', Logger.log(`Showing [${list.length}] routes`, ['blue', 'bold'], false), 'info', false, false, ' ')
    }

    private asJson (list: IRoute[]) {
        const routes = list.map(route => ({
            methods: route.getMethods(),
            uri: route.uri(),
            name: route.getName(),
            action: route.action,
        }))

        if (this.app.runningInConsole()) {
            this.newLine()
            console.log(JSON.stringify(routes, null, 2))
            this.newLine()
        } else {
            return routes
        }
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
