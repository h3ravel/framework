import { Resource } from './Resource'

export interface CollectionMeta {
    pagination?: {
        from?: number
        to?: number
        perPage?: number
        total?: number
    }
    [key: string]: any
}

export interface CollectionLinks {
    self?: string
    next?: string
    prev?: string
    [key: string]: any
}

export class Collection<T = any> {
    protected items: (T | Resource)[]
    protected meta: CollectionMeta = {}
    protected links: CollectionLinks = {}

    /**
     * Accept items, optional pagination, and optional links
     */
    constructor(
        items: (T | Resource)[] = [],
        pagination?: CollectionMeta['pagination'],
        links?: CollectionLinks
    ) {
        this.items = items
        if (pagination) this.meta.pagination = pagination
        if (links) this.links = links
    }

    /**
     * Set pagination metadata
     */
    withPagination(pagination: CollectionMeta['pagination']): this {
        this.meta.pagination = pagination
        return this
    }

    /**
     * Set links metadata
     */
    withLinks(links: CollectionLinks): this {
        this.links = links
        return this
    }

    /**
     * Convert collection to plain object
     */
    toArray(): any[] {
        return this.items.map(item => {
            if (item instanceof Resource) {
                return item.toArray()
            }
            return item
        })
    }

    /**
     * Build full collection JSON response
     */
    json(): { data: any[]; meta?: CollectionMeta; links?: CollectionLinks } {
        return {
            data: this.toArray(),
            meta: Object.keys(this.meta).length ? this.meta : undefined,
            links: Object.keys(this.links).length ? this.links : undefined,
        }
    }
}
