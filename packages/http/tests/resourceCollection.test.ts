import { describe, it, expect } from 'vitest'
import { Resource } from '../src/Resources/Resource'
import { Collection } from '../src/Resources/Collection'
import { JsonResource } from '../src/Resources/JsonResource'

// Mock model with a relationship
class User {
    constructor(public id: number, public name: string, public posts: any[] = []) {}
}

class Post {
    constructor(public id: number, public title: string) {}
}

describe('Resource & Collection', () => {

    // ---- Resource Tests ----
    it('Resource toArray returns raw data', () => {
        const resource = new Resource({ id: 1, name: 'John' })
        expect(resource.toArray()).toEqual({ id: 1, name: 'John' })
    })

    it('Resource includes relationships with "with()"', () => {
        const user = new User(1, 'Alice', [new Post(10, 'Hello')])
        const resource = new Resource(user).with('posts')
        expect(resource.toArray()).toEqual({
            id: 1,
            name: 'Alice',
            posts: [{ id: 10, title: 'Hello' }]
        })
    })

    // ---- Collection Tests ----
    it('Collection toArray returns array of resources', () => {
        const items = [new Resource({ id: 1 }), new Resource({ id: 2 })]
        const collection = new Collection(items)
        expect(collection.toArray()).toEqual([{ id: 1 }, { id: 2 }])
    })

    it('Collection json includes meta & links when provided', () => {
        const items = [new Resource({ id: 1 }), new Resource({ id: 2 })]
        const collection = new Collection(
            items,
            { from: 1, to: 2, total: 10, perPage: 2 },
            { self: '/users', next: '/users?page=2' }
        )
        expect(collection.json()).toEqual({
            data: [{ id: 1 }, { id: 2 }],
            meta: { pagination: { from: 1, to: 2, total: 10, perPage: 2 } },
            links: { self: '/users', next: '/users?page=2' }
        })
    })

    it('Collection handles empty items', () => {
        const collection = new Collection([], { from: 0, to: 0, total: 0, perPage: 10 }, { self: '/users' })
        expect(collection.toArray()).toEqual([])
        expect(collection.json()).toEqual({
            data: [],
            meta: { pagination: { from: 0, to: 0, total: 0, perPage: 10 } },
            links: { self: '/users' }
        })
    })

    // ---- JsonResource Tests ----
    it('JsonResource transforms a single Resource', () => {
        const resource = new Resource({ id: 5 })
        const jsonRes = new JsonResource({ req: {}, res: { status: 200 } } as any, resource).json()
        expect(jsonRes.body).toEqual({ data: { id: 5 } })
    })

    it('JsonResource transforms a Collection with meta & links', () => {
        const resource1 = new Resource({ id: 1 })
        const resource2 = new Resource({ id: 2 })
        const collection = new Collection(
            [resource1, resource2],
            { from: 1, to: 2, total: 5, perPage: 2 },
            { self: '/users' }
        )
        const jsonRes = new JsonResource({ req: {}, res: { status: 200 } } as any, collection).json()
        expect(jsonRes.body).toEqual({
            data: [{ id: 1 }, { id: 2 }],
            meta: { pagination: { from: 1, to: 2, total: 5, perPage: 2 } },
            links: { self: '/users' }
        })
    })

    it('JsonResource handles nested resources', () => {
        const user = new User(1, 'Alice', [new Post(10, 'Hello')])
        const resource = new Resource(user).with('posts')
        const jsonRes = new JsonResource({ req: {}, res: { status: 200 } } as any, resource).json()
        expect(jsonRes.body).toEqual({
            data: {
                id: 1,
                name: 'Alice',
                posts: [{ id: 10, title: 'Hello' }]
            }
        })
    })

})
