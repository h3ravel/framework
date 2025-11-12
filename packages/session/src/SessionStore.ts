import { DriverBuilder, DriverOption } from './Contracts/SessionContract'

/**
 * SessionStore (Driver registry)
 *
 * Register driver builders under a name and then create instances using:
 *   SessionStore.make('file', sessionId, options)
 */
export class SessionStore {
    private static registry: Map<string, DriverBuilder> = new Map()

    /**
     * Register a driver builder under a key (e.g. 'file', 'database', 'memory').
     */
    public static register (name: 'file' | 'memory' | 'database' | 'redis', builder: DriverBuilder) {
        this.registry.set(name, builder)
    }

    /**
     * Create a driver instance for the given sessionId using the named builder.
     *
     * If driver not found, throws. Options is a simple key/value bag passed to the builder.
     */
    public static make (name: 'file' | 'memory' | 'database' | 'redis', sessionId: string, options: DriverOption = {}) {
        const builder = this.registry.get(name)
        if (!builder) throw new Error(`Session driver "${name}" is not registered`)
        return builder(sessionId, options)
    }
}
