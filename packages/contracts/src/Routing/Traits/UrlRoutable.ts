import { IModel } from '../../Database/IModel'

export abstract class UrlRoutable {
    /**
     * Get the value of the model's route key.
     */
    abstract getRouteKey (): any;

    /**
     * Retrieve the model for a bound value.
     *
     * @param  value
     * @param  field
     */
    abstract resolveRouteBinding (value: any, field?: string): Promise<IModel<any>>;

    /**
     * Retrieve the child model for a bound value.
     *
     * @param  childType
     * @param  value
     * @param  field
     */

    /**
     * Get the route key for the model.
     */
    abstract getRouteKeyName (): string;
}