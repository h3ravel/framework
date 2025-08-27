import { Application } from '@h3ravel/core'
import { ConfigServiceProvider } from '@h3ravel/config'
import { IServiceProvider } from '@h3ravel/shared'
import { DatabaseServiceProvider } from '@h3ravel/database'
import { ConsoleServiceProvider } from '../Providers/ConsoleServiceProvider'
import { HttpServiceProvider } from '@h3ravel/http'

/**
 * Default service provider have a priority ranging from 999-990
 * We recommend leaving the 900 range for the defaults.
 */
export default <Array<new (_app: Application) => IServiceProvider>>[
    HttpServiceProvider,
    ConfigServiceProvider,
    DatabaseServiceProvider,
    ConsoleServiceProvider,
    // RouteServiceProvider, 
]
