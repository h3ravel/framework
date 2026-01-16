export class RouteParameter {
    constructor(
        private name: string,
        private type: any
    ) { }

    /**
     * Ge the route parameter name
     */
    getName () {
        return this.name
    }

    /**
     * Ge the route parameter type
     */
    getType () {
        return this.type
    }
}