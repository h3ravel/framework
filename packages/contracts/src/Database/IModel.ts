import { Builder, Model } from '@h3ravel/arquebus'

import { IQueryBuilder } from '@h3ravel/arquebus/types'

export abstract class IModel<M extends Model = any> extends Model {
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
    abstract resolveRouteBindingQuery (query: Builder, value: any, field?: undefined | string | null): IQueryBuilder<M>;

    /**
     * Get the value of the model's route key.
     */
    abstract getRouteKey (): any;

    /**
     * Get the route key for the model.
     */
    abstract getRouteKeyName (): string;
}