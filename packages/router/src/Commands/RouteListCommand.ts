import { IApplication, RouteMethod } from '@h3ravel/contracts'
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
        this.newLine()
        const command = (this.dictionary.baseCommand ?? this.dictionary.name)

        await Reflect.apply(this[command], this, [])
    }

    /**
     * List all registered routes.
     */
    protected async list () {
        /**
         * Sort the routes alphabetically
         */
        const list = this.app.make('router').getRoutes().getRoutes().sort((a, b) => {
            if (a.path === '/' && b.path !== '/') return -1
            if (b.path === '/' && a.path !== '/') return 1
            return a.path.localeCompare(b.path)
        })


        // /**
        //  * Log the route list
        //  */
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
