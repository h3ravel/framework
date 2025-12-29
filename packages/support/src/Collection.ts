import { Collection as BaseCollection } from '@h3ravel/collect.js'

export class Collection<Item = any> extends BaseCollection<Item> {
    /**
     * 
     * @param collection 
     */
    constructor(collection?: Item[] | Item) {
        super(collection)
    }
}

/**
 * 
 * @param collection 
 * @returns 
 */
export const collect = <T> (collection?: T | T[] | undefined): Collection<T> => {
    return new Collection(collection)
}