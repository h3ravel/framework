import { InvalidArgumentException } from '@h3ravel/support'

/**
 * Exception thrown when an incorrect command name typed in the console.
 */
export class CommandNotFoundException extends InvalidArgumentException {
    /**
     * @param  message      Exception message to throw
     * @param  alternatives List of similar defined names
     * @param  code         Exception code
     * @param  previous     Previous exception used for the exception chaining
     */
    constructor(
        message: string,
        private alternatives: string[] = [],
        public code = 0,
        public previous?: Error,
    ) {
        super(message)
    }

    getAlternatives (): string[] {
        return this.alternatives
    }
}
