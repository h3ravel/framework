import { ServiceProvider } from '@h3ravel/core'
import { StorageLinkCommand } from '../Commands/StorageLinkCommand'

/**
 * Sets up Filesystem management and lifecycle.
 * 
 */
export class FilesystemProvider extends ServiceProvider {
    public static priority = 997

    register () {
        this.registerCommands([StorageLinkCommand])
    }
}
