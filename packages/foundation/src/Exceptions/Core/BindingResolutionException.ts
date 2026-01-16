
export class BindingResolutionException extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'BindingResolutionException'
    }
}