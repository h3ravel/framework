import { CallableConstructor, IRequest } from '@h3ravel/contracts'
import { Container, ContainerResolver } from '@h3ravel/core'

import { Logger } from '@h3ravel/shared'
import { Pipe } from './Contracts/Utilities'
import { RuntimeException } from '@h3ravel/support'

export class Pipeline<XP = any> {
    /**
     * The final callback to be executed after the pipeline ends regardless of the outcome.
     */
    finally?: (...args: any[]) => any

    /**
     * Indicates whether to wrap the pipeline in a database transaction.
     */
    protected withinTransaction?: string | false = false

    /**
     * The container implementation.
     */
    protected container?: Container

    /**
     * The object being passed through the pipeline.
     */
    private passable!: XP

    /**
     * The array of class pipes.
     */
    private pipes: Pipe[] = []

    /**
     * The method to call on each pipe.
     */
    protected method = 'handle'

    constructor(app?: Container) {
        this.container = app
    }

    /**
     * Set the method to call on the pipes.
     *
     * @param method
     */
    via (method: string) {
        this.method = method

        return this
    }

    send (passable: XP) {
        this.passable = passable
        return this
    }

    through (pipes: any[]) {
        this.pipes = pipes
        return this
    }

    /**
     * Run the pipeline with a final destination callback.
     *
     * @param  destination
     */
    async then<R> (destination: (passable: XP) => Promise<R>): Promise<R> {
        const pipes = [...this.pipes].reverse()
        // Build the pipeline chain using reduce (mirrors Laravel’s array_reduce)
        const pipeline = pipes.reduce(
            this.carry(),
            this.prepareDestination(destination),
        )

        try {
            if (this.withinTransaction !== false) {
                const connection = this.getContainer()
                    .make('db')
                    .connection(this.withinTransaction)

                return await connection.transaction(async () => {
                    return pipeline(this.passable)
                })
            }

            // Normal flow
            return await pipeline(this.passable)
        } finally {
            if (this.finally) {
                (this.finally)(this.passable)
            }
        }
    }

    /**
     * Run the pipeline and return the result.
     */
    async thenReturn () {
        return await this.then(async function (passable) {
            return passable
        })
    }

    private carry () {
        return (stack: (passable: XP) => Promise<any>, pipe: Pipe) => {
            return async (passable: XP) => {
                try {
                    // pipe is a callable middleware fn
                    if (typeof pipe === 'function' && ContainerResolver.isCallable(pipe)) {
                        return await pipe(passable, stack)
                    }

                    let instance = pipe as Exclude<Pipe, string>
                    let parameters: any[] = [passable, stack]

                    // If pipe is a string (class reference)
                    if (typeof pipe === 'string') {
                        const [name, extras] = this.parsePipeString(pipe)

                        const bound = this.getContainer().boundMiddlewares(name)
                        if (bound) {
                            instance = this.getContainer().make(bound as never)
                            parameters = [passable, stack, ...extras]
                        } else {
                            instance = async function (request: IRequest, next) {
                                Logger.error(`Error: Middleware [${name}] requested by [${request.getRequestUri()}] not bound: Skipping...`, false)
                                return next
                            }
                        }

                        // Pipe is an object instance
                    } else if (typeof pipe === 'function') {
                        instance = this.getContainer().make(pipe)
                    }

                    const handler: CallableConstructor = instance[this.method as never] ?? instance
                    // const result = 'await handler.apply(instance, parameters)'
                    const result = Reflect.apply(handler, instance, parameters)

                    return await this.handleCarry(result)

                } catch (e: any) {
                    return this.handleException(passable, e)
                }
            }
        }
    }

    private async handleCarry (carry: any) {
        if (typeof carry?.then === 'function') {
            return await carry
        }

        return carry
    }

    /**
     * Get the final piece of the Closure onion.
     *
     * @param  destination
     */
    private prepareDestination (destination: (passable: XP) => Promise<any>) {
        return async (passable: XP) => {
            try {
                return await destination(passable ?? this.passable)
            } catch (e: any) {
                return this.handleException(passable ?? this.passable, e)
            }
        }
    }

    /**
     * Handle the given exception.
     *
     * @param  _passable
     * @param  e
     * @throws {Error}
     */
    protected handleException (_passable: any, e: Error) {
        throw e
    }

    /**
     * Parse full pipe string to get name and parameters.
     *
     * @param  pipe
     */
    private parsePipeString (pipe: string): [string, any[]] {
        const [name, paramString] = pipe.split(':')
        const params = paramString ? paramString.split(',') : []
        return [name, params]
    }

    /**
     * Set the container instance.
     *
     * @param  container
     */
    setContainer (container: Container) {
        this.container = container

        return this
    }

    /**
     * Execute each pipeline step within a database transaction.
     *
     * @param  withinTransaction
     */
    setWithinTransaction (withinTransaction?: string | false) {
        this.withinTransaction = withinTransaction

        return this
    }

    /**
     * Set a final callback to be executed after the pipeline ends regardless of the outcome.
     *
     * @param callback
     */
    setFinally (callback: (...args: any[]) => any) {
        this.finally = callback

        return this
    }

    /**
     * Get the container instance.
     */
    protected getContainer () {
        if (!this.container) {
            throw new RuntimeException('A container instance has not been passed to the Pipeline.')
        }

        return this.container
    }
}
