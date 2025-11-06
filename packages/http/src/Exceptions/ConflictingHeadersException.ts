export class ConflictingHeadersException extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ConflictingHeadersException'
    }
}
