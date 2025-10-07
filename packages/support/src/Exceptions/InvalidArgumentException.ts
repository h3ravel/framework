/**
 * Custom error for invalid type coercion
 */
export class InvalidArgumentException extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'InvalidArgumentException'
    }
}
