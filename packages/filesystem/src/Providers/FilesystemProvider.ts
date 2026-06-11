import { IStorage } from '@h3ravel/foundation'
import { ServiceProvider } from '@h3ravel/core'
import { Storage } from '../Storage'
import { StorageLinkCommand } from '../Commands/StorageLinkCommand'

/**
 * Sets up Filesystem management and lifecycle.
 * 
 */
export class FilesystemProvider extends ServiceProvider {
    public static priority = 997

    register () {
        this.registerCommands([StorageLinkCommand])
        this.app.singleton('storage', () => new Storage(this.app))
        this.app.alias([
            [Storage, 'storage'],
            [IStorage, 'storage'],
        ])
    }
}
