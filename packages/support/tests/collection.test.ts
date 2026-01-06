import { Collection, collect } from '../src/Collection'
import { describe, expect, test } from 'vitest'

describe('Collection', () => {
    test('test collection', () => {
        // console.log(new Collection([{ name: 'james', age: 12, page: 12, gage: 12, sage: 12, fage: 12 }]).chunk(3).all())
        // console.log(new Collection({ name: 'james' }), new Collection([1, 2, 3]), collection('Men'))

        expect(new Collection({ name: 'james' }).get('name')).toBe('james')
        expect(collect([1, 2, 3]).all()).toEqual([1, 2, 3])
    })
})
