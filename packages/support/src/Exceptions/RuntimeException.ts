/**
 * Exception thrown if an error which can only be found on runtime occurs.
 */
export class RuntimeException extends Error {
    constructor(message: string = '') {
        super(message)
        this.name = 'RuntimeException'
    }
}
