import { HashManager } from '../HashManager'
import { ServiceProvider } from '@h3ravel/support'

/**
 * Register HashManager. 
 */
export class HashingServiceProvider extends ServiceProvider {
    public static priority = 991

    register () {
        const manager = new HashManager(this.app.make('config').get('hashing'))

        this.app.singleton('hash', () => {
            return manager
        })

        this.app.singleton('hash.driver', () => {
            return manager.driver()
        })
    }
}
