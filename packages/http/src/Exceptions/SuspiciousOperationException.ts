export class SuspiciousOperationException extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'SuspiciousOperationException'
    }
}
