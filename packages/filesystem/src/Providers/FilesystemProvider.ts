import { FilesystemManager } from '../FilesystemManager'
import { IFilesystemManager } from '@h3ravel/foundation'
import { ServiceProvider } from '@h3ravel/support'
import { StorageLinkCommand } from '../Commands/StorageLinkCommand'

/**
 * Sets up Filesystem management and lifecycle.
 * 
 */
export class FilesystemProvider extends ServiceProvider {
    public static priority = 997

    register () {
        this.registerCommands([StorageLinkCommand])
        this.app.singleton('storage', () => new FilesystemManager())
        this.app.alias([
            [FilesystemManager, 'storage'],
            [IFilesystemManager, 'storage'],
        ])
    }
}
