import { AppEvent, AppListener } from '../Utilities/Utilities'

import { JobPayload } from '../Queue/Utils'

export abstract class IDispatcher {
    /**
     * Register an event listener with the dispatcher.
     *
     * @param  events
     * @param listener
     */
    abstract listen (events: AppEvent | AppEvent[] | string | string[], listener?: AppListener | AppListener[] | string | string[]): void;
    /**
     * Determine if a given event has listeners.
     *
     * @param  eventName
     * @return bool
     */
    abstract hasListeners (eventName: string): any[];
    /**
     * Determine if the given event has any wildcard listeners.
     *
     * @param  eventName
     */
    abstract hasWildcardListeners (eventName: string): boolean;
    /**
     * Register an event and payload to be fired later.
     *
     * @para  event
     * @param payload
     * @return void
     */
    abstract push (event: string, payload?: Record<string, any> | any[]): void;
    /**
     * Flush a set of pushed events.
     *
     * @param event
     */
    abstract flush (event: string): void;
    /**
     * Fire an event until the first non-null response is returned.
     *
     * @param event
     * @param  mixed  payload
     * @return mixed
     */
    abstract until (event: AppEvent, payload?: JobPayload): void;
    /**
     * Fire an event and call the listeners.
     *
     * @param event
     * @param payload
     * @param halt
     */
    abstract dispatch (event: Record<string, any> | string, payload?: Record<string, any> | any[], halt?: boolean): void;
    /**
     * Remove a set of listeners from the dispatcher.
     *
     * @param  event
     */
    abstract forget (event: string): void;
    /**
     * Forget all of the pushed listeners.
     *
     * @return void
     */
    abstract forgetPushed (): void;
    /**
     * Set the queue resolver implementation.
     *
     * @param  callable  $resolver
     * @return this
     */
    abstract setQueueResolver (resolver: (...a: any[]) => any): this;
    /**
     * Set the database transaction manager resolver implementation.
     *
     * @param resolver
     */
    abstract setTransactionManagerResolver (resolver: (...a: any[]) => any): this;
    /**
     * Execute the given callback while deferring events, then dispatch all deferred events.
     *
     * @param  callback
     * @param  events
     */
    abstract defer (callback: (...a: any[]) => any, events: AppEvent[]): any;
    /**
     * Gets the raw, unprepared listeners.
     *
     * @return array
     */
    abstract getRawListeners (): Record<string, any[]>;
}