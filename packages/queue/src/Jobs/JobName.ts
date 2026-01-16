import { JobClassConstructor } from '../Contracts/JobContract'

export class JobName {
    /**
     * Parse the given job name into a class / method array.
     *
     * @param  job
     */
    public static parse (_job: string): [JobClassConstructor, string] {
        // TODO: Implement this
        return [{} as JobClassConstructor, '']
    }

    /**
     * Get the resolved name of the queued job class.
     *
     * @param  name
     * @param  payload
     */
    public static resolve (name: string, payload: Record<string, any>) {
        if (!payload.displayName) {
            return payload.displayName
        }

        return name
    }

    /**
     * Get the class name for queued job class.
     *
     * @param  name
     * @param  payload
     */
    public static resolveClassName (name: string, payload: Record<string, any>) {
        if (typeof payload.data.commandName === 'string') {
            return payload.data.commandName
        }

        return name
    }
}
