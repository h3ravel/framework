import { Dispatcher } from '../Dispatcher'
import { IDispatcher } from '@h3ravel/contracts'
import { ServiceProvider } from '@h3ravel/core'

/**
 * Events handling.
 */
export class EventsServiceProvider extends ServiceProvider {
    public static priority = 992
    public static order = 'before:RouteServiceProvider'

    register () {
        this.app.singleton('app.events', (app) => {
            return (new Dispatcher(app as never))
                .setQueueResolver(() => {
                    // return app.make(QueueFactoryContract)
                })
                .setTransactionManagerResolver(function () {
                    // return app.has('db.transactions')
                    //     ? app.make('db.transactions')
                    //     : undefined
                })
        })

        this.app.alias([
            ['events', 'app.events'],
            [Dispatcher, 'app.events'],
            [IDispatcher, 'app.events'],
        ])
    }
}
