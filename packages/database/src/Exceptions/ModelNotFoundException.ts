import { Arr } from '@h3ravel/support'
import { Model } from '../Model'
import { RecordsNotFoundException } from './RecordsNotFoundException'

export class ModelNotFoundException extends RecordsNotFoundException {
    /**
     * Name of the affected Eloquent model.
     */
    protected model?: Model

    /**
     * The affected model IDs.
     */
    protected ids: (number | string)[] = []

    /**
     * Set the affected Eloquent model and instance ids.
     *
     * @param  model
     * @param  ids
     */
    public setModel (model: Model, ids: (number | string)[] = []) {
        this.model = model
        this.ids = Arr.wrap(ids)

        this.message = `No query results for model [{${model.constructor.name}}]`

        if (this.ids.length > 0) {
            this.message += ' ' + this.ids.join(', ')
        } else {
            this.message += '.'
        }

        return this
    }

    /**
     * Get the affected Eloquent model.
     */
    public getModel () {
        return this.model
    }

    /**
     * Get the affected Eloquent model IDs.
     */
    public getIds () {
        return this.ids
    }
}
