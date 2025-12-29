export class LogicException extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'LogicException'
    }
}
