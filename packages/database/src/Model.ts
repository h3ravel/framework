import { BelongsToMany, HasManyThrough } from '@h3ravel/arquebus/relations'
import { IBuilder, Relation } from '@h3ravel/arquebus/types'

import { Model as BaseModel } from '@h3ravel/arquebus'
import { Str } from '@h3ravel/support'
import { UrlRoutable } from '@h3ravel/contracts'
import { mix } from '@h3ravel/shared'

export class Model<M extends BaseModel = any> extends mix(UrlRoutable, BaseModel) {
    /**
     * Retrieve the model for a bound value.
     * 
     * @param  value 
     * @param  field 
     */
    // @ts-expect-error because we don't really care
    resolveRouteBinding (value: any, field?: string): Promise<M> {
        return this.resolveRouteBindingQuery(this.newQuery() as never, value, field).first() as never
    }

    /**
     * Retrieve the model for a bound value.
     *
     * @param  query
     * @param  value
     * @param  field
     */
    resolveRouteBindingQuery (query: IBuilder<M>, value: any, field: undefined | string | null = null): IBuilder<M> {
        return query.where(field ?? this.getRouteKeyName(), value) as never
    }

    /**
     * Retrieve the model for a bound value.
     *
     * @param  value
     * @param  field
     */
    resolveSoftDeletableRouteBinding (value: any, field?: string): Promise<M | null | undefined> {
        return this.resolveRouteBindingQuery(this.newQuery() as never, value, field).withTrashed().first()
    }

    /**
     * Retrieve the child model for a bound value.
     *
     * @param  childType
     * @param  value
     * @param  field 
     */
    resolveChildRouteBinding (childType: string, value: any, field: string): Promise<M | null | undefined> {
        return this.resolveChildRouteBindingQuery(childType, value, field).first() as never
    }

    /**
     * Retrieve the child model for a bound value.
     *
     * @param  childType
     * @param  value
     * @param  field 
     */
    resolveSoftDeletableChildRouteBinding (childType: string, value: any, field: string): Promise<M | null | undefined> {
        return this.resolveChildRouteBindingQuery(childType, value, field).withTrashed().first() as never
    }

    /**
     * Retrieve the child model query for a bound value.
     *
     * @param  childType
     * @param  value
     * @param  field
     */
    protected resolveChildRouteBindingQuery (childType: string, value: any, field: string): Relation<Model<M>> {
        const relationship = this[this.childRouteBindingRelationshipName(childType)]()

        field = field || relationship.getRelated().getRouteKeyName()

        if (relationship instanceof HasManyThrough ||
            relationship instanceof BelongsToMany) {
            field = relationship.getRelated().qualifyColumn(field)
        }

        return relationship instanceof Model
            ? relationship.resolveRouteBindingQuery(relationship.newQuery() as never, value, field)
            : relationship.getRelated().resolveRouteBindingQuery(relationship, value, field)
    }

    /**
     * Retrieve the child route model binding relationship name for the given child type.
     *
     * @param  childType
     */
    protected childRouteBindingRelationshipName (childType: string): keyof typeof this {
        return Str.plural(Str.camel(childType))
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
