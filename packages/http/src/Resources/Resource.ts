export interface ResourceData {
    [key: string]: any
}

/**
 * Base class for API Resources.
 * Wraps a single model or object and provides methods for serialization.
 */
export class Resource<T extends ResourceData = any> {
    protected model: T
    protected relations: Record<string, any> = {}

    constructor(model: T) {
        this.model = model
    }

    /**
     * Include a related property (like a relationship)
     * Example: new Resource(user).with('posts')
     */
    with(key: string, value?: any): this {
        if (typeof value !== 'undefined') {
            this.relations[key] = value
        } else if (key in this.model) {
            this.relations[key] = this.model[key]
        }
        return this
    }

    /**
     * Include multiple relations at once
     */
    withRelations(relations: Record<string, any>): this {
        this.relations = { ...this.relations, ...relations }
        return this
    }

    /**
     * Convert resource to plain object (for JSON)
     */
    toArray(): ResourceData {
        const relations: Record<string, any> = {}
        for (const key in this.relations) {
            relations[key] = this.transformRelation(this.relations[key])
        }

        return {
            ...this.model,
            ...relations,
        }
    }

    /**
     * Helper to transform relationships recursively
     */
    protected transformRelation(value: any): any {
        if (value instanceof Resource) {
            return value.toArray()
        }
        if (Array.isArray(value)) {
            return value.map(v => this.transformRelation(v))
        }
        return value
    }
}
