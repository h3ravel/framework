export abstract class IModel<M = any> {
    /**
     * Retrieve the model for a bound value.
     *
     * @param value
     * @param field
     * @returns
     */
    abstract resolveRouteBinding (value: any, field?: undefined | string | null): Promise<M>;

    /**
     * Retrieve the model for a bound value.
     *
     * @param  query
     * @param  value
     * @param  field
     */
    abstract resolveRouteBindingQuery (query: any, value: any, field?: undefined | string | null): any;

    /**
     * Get the value of the model's route key.
     */
    abstract getRouteKey (): any;

    /**
     * Get the route key for the model.
     */
    abstract getRouteKeyName (): string;
}