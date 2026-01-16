export class HigherOrderTapProxy<Target extends Record<string, (...args: any[]) => any>> {
    /**
     * The target being tapped.
     */
    public target: Target

    /**
     * Create a new tap proxy instance.
     */
    public constructor(target: Target) {
        this.target = target
    }

    /**
     * Dynamically pass method calls to the target.
     *
     * @param  method
     * @param  parameters
     */
    public __call (method: string, parameters: any[]) {
        this.target[method](...parameters)

        return this.target
    }
}
