import { Model as BaseModel } from '@h3ravel/arquebus'

export class Model<M extends BaseModel = any> extends BaseModel {
    /**
     * Retrieve the model for a bound value.
     * 
     * @param {any}  value 
     * @param {String|null} field 
     * @returns 
     */
    public resolveRouteBinding (value: any, field: undefined | string | null = null): Promise<M> {
        return this.newQuery().where(field ?? 'ids', value).firstOrFail() as unknown as Promise<M>
    }
}
