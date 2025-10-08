/**
 * Custom error for invalid type coercion
 */
export class RuntimeException extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'RuntimeException'
    }
}
