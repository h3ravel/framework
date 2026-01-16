import { AppEvent, AppListener, ListenerClassConstructor } from './Contracts/EventsContract'
import { Arr, Str } from '@h3ravel/support'

import { Container } from '@h3ravel/core'

export class Dispatcher {
    /**
     * The IoC container instance.
     */
    protected container: Container

    /**
     * The registered event listeners.
     */
    protected listeners: Record<string, any[]> = {}

    /**
     * The wildcard listeners.
     */
    protected wildcards: Record<string, any[]> = {}

    /**
     * The cached wildcard listeners.
     */
    protected wildcardsCache: Record<string, any[]> = {}

    /**
     * The queue resolver instance.
     */
    protected queueResolver?: (...a: any[]) => any

    /**
     * The database transaction manager resolver instance.
     */
    protected transactionManagerResolver?: (...a: any[]) => any

    /**
     * The currently deferred events.
     */
    protected deferredEvents: Record<string, any[]> = {}

    /**
     * Indicates if events should be deferred.
     */
    protected deferringEvents = false

    /**
     * The specific events to defer (null means defer all events).
     */
    protected eventsToDefer?: AppEvent[]

    /**
     * Create a new event dispatcher instance.
     */
    constructor(container: Container) {
        this.container = container ?? new Container()
    }

    /**
     * Register an event listener with the dispatcher.
     *
     * @param  events
     * @param listener
     */
    public listen (events: AppEvent | AppEvent[] | string | string[], listener?: AppListener | AppListener[] | string | string[]) {
        for (const event of Arr.wrap(events)) {
            if (typeof event === 'string' && listener) {
                if (event.includes('*')) {
                    this.setupWildcardListen(event, listener)
                } else {
                    this.listeners[event].push(listener)
                }
            } else if (typeof event === 'function') {
                event(listener)
            } else if (typeof listener === 'function') {
                listener()
            }
        }
    }

    /**
     * Setup a wildcard listener callback.
     *
     * @param  event
     * @param  listener
     */
    protected setupWildcardListen (event: string, listener: AppListener | AppListener[] | string | string[]) {
        this.wildcards[event].push(listener)

        this.wildcardsCache = {}
    }

    /**
     * Determine if a given event has listeners.
     *
     * @param  eventName
     * @return bool
     */
    public hasListeners (eventName: string) {
        return this.listeners[eventName] ||
            this.wildcards[eventName] ||
            this.hasWildcardListeners(eventName)
    }

    /**
     * Determine if the given event has any wildcard listeners.
     *
     * @param  eventName
     */
    public hasWildcardListeners (eventName: string) {
        for (const [key] of Object.entries(this.wildcards)) {
            if (Str.is(key, eventName)) {
                return true
            }
        }

        return false
    }

    /**
     * Register an event and payload to be fired later.
     *
     * @para  event
     * @param payload
     * @return void
     */
    public push (event: string, payload: Record<string, any> | any[] = []) {
        this.listen(event + '_pushed', () => {
            this.dispatch(event, payload)
        })
    }

    /**
     * Flush a set of pushed events.
     *
     * @param event
     */
    public flush (event: string) {
        this.dispatch(event + '_pushed')
    }

    /**
     * Resolve the subscriber instance.
     *
     * @param  subscriber
     */
    protected resolveSubscriber (subscriber: string | ListenerClassConstructor) {
        if (typeof subscriber === 'string') {
            return this.container.make(subscriber as never)
        }

        return subscriber
    }

    /**
     * Fire an event until the first non-null response is returned.
     *
     * @param event
     * @param  mixed  payload
     * @return mixed
     */
    public until (event: AppEvent, payload = {}) {
        return this.dispatch(event, payload, true)
    }

    /**
     * Fire an event and call the listeners.
     *
     * @param event
     * @param payload
     * @param halt
     */
    public dispatch (event: Record<string, any> | string, _payload: Record<string, any> | any[] = [], _halt = false) {
    }

    /**
     * Remove a set of listeners from the dispatcher.
     *
     * @param  event
     */
    public forget (event: string) {
        if (event.includes('*')) {
            delete this.wildcards[event]
        } else {
            delete this.listeners[event]
        }

        for (const [key] of Object.entries(this.wildcardsCache)) {
            if (Str.is(event, key)) {
                delete this.wildcardsCache[key]
            }
        }
    }

    /**
     * Forget all of the pushed listeners.
     *
     * @return void
     */
    public forgetPushed () {
        for (const [key] of Object.entries(this.listeners)) {
            if (key.endsWith('_pushed')) {
                this.forget(key)
            }
        }
    }

    /**
     * Get the queue implementation from the resolver.
     */
    protected resolveQueue () {
        return this.queueResolver?.()
    }

    /**
     * Set the queue resolver implementation.
     *
     * @param  callable  $resolver
     * @return this
     */
    public setQueueResolver (resolver: (...a: any[]) => any) {
        this.queueResolver = resolver

        return this
    }

    /**
     * Get the database transaction manager implementation from the resolver.
     */
    protected resolveTransactionManager () {
        return this.transactionManagerResolver?.()
    }

    /**
     * Set the database transaction manager resolver implementation.
     *
     * @param resolver
     */
    public setTransactionManagerResolver (resolver: (...a: any[]) => any) {
        this.transactionManagerResolver = resolver

        return this
    }

    /**
     * Execute the given callback while deferring events, then dispatch all deferred events.
     *
     * @param  callback
     * @param  events
     */
    public defer (callback: (...a: any[]) => any, events: AppEvent[]) {
        const wasDeferring = this.deferringEvents
        const previousDeferredEvents = this.deferredEvents
        const previousEventsToDefer = this.eventsToDefer

        this.deferringEvents = true
        this.deferredEvents = {}
        this.eventsToDefer = events

        try {
            const result = callback()

            this.deferringEvents = false

            for (const args of Object.entries(this.deferredEvents)) {
                this.dispatch(...args)
            }

            return result
        } finally {
            this.deferringEvents = wasDeferring
            this.deferredEvents = previousDeferredEvents
            this.eventsToDefer = previousEventsToDefer
        }
    }

    /**
     * Determine if the given event should be deferred.
     *
     * @param  event
     */
    protected shouldDeferEvent (event: AppEvent) {
        return this.deferringEvents && (this.eventsToDefer === null || this.eventsToDefer?.includes(event))
    }

    /**
     * Gets the raw, unprepared listeners.
     *
     * @return array
     */
    public getRawListeners () {
        return this.listeners
    }
}
