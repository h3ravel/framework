import { Model as BaseModel, Builder } from '@h3ravel/arquebus'

import { IQueryBuilder } from '@h3ravel/arquebus/types'

export class Model<M extends BaseModel = any> extends BaseModel {
    /**
     * Retrieve the model for a bound value.
     * 
     * @param {any}  value 
     * @param {String|null} field 
     * @returns 
     */
    resolveRouteBinding (value: any, field: undefined | string | null = null): Promise<M> {
        // return this.newQuery().where(field ?? 'ids', value).firstOrFail() as unknown as Promise<M>
        return this.resolveRouteBindingQuery(this as never, value, field).firstOrFail() as never
    }

    /**
     * Retrieve the model for a bound value.
     *
     * @param  query
     * @param  value
     * @param  field
     */
    resolveRouteBindingQuery (query: Builder, value: any, field: undefined | string | null = null): IQueryBuilder<M> {
        return query.where(field ?? this.getRouteKeyName(), value) as never
    }

    /**
     * Get the value of the model's route key.
     */
    getRouteKey () {
        return this.getAttribute(this.getRouteKeyName())
    }

    /**
     * Get the route key for the model.
     */
    getRouteKeyName () {
        return this.getKeyName()
    }
}
