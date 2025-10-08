import { HashManager } from '../HashManager'

/**
 * Register HashManager. 
 */
export class HashingServiceProvider {
    public static priority = 991

    constructor(private app: any) { }

    register () {
        const manager = new HashManager(this.app.make('config').get('hashing'))

        globalThis.Hash = manager

        this.app.singleton('hash', () => {
            return manager
        })

        this.app.singleton('hash.driver', () => {
            return manager.driver()
        })
    }
}
