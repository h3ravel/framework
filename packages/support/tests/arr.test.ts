import * as Arr from '../src/Helpers/Arr'

describe('Arr helpers', () => {
    test('chunk: splits into chunks and handles remainders', () => {
        expect(Arr.chunk([1,2,3,4,5], 2)).toEqual([[1,2],[3,4],[5]])
        expect(Arr.chunk([], 2)).toEqual([])
        expect(() => Arr.chunk([1], 0)).toThrow('Chunk size must be greater than 0')
    })

    test('collapse: flattens one level', () => {
        expect(Arr.collapse([1,[2,3],[4]])).toEqual([1,2,3,4])
    })

    test('alternate: zips two arrays of different sizes', () => {
        expect(Arr.alternate([1,3,5], [2,4])).toEqual([1,2,3,4,5])
        expect(Arr.alternate([], [1,2])).toEqual([1,2])
    })

    test('combine: sums by index across arrays', () => {
        expect(Arr.combine([1,2,3],[4,5,6])).toEqual([5,7,9])
        expect(Arr.combine([1],[2,3,4])).toEqual([3,3,4])
    })

    test('find/forget/first/last/isEmpty', () => {
        expect(Arr.find(2, [1,2,3])).toBe(2)
        expect(Arr.find(4, [1,2,3])).toBeNull()
        expect(Arr.forget([1,2,3,4], [1,3])).toEqual([1,3])
        expect(Arr.isEmpty([])).toBe(true)
        const [first, rest1] = Arr.first([1,2,3])
        expect(first).toBe(1)
        expect(rest1).toEqual([2,3])
        const [last, rest2] = Arr.last([1,2,3])
        expect(last).toBe(3)
        expect(rest2).toEqual([1,2])
    })

    test('pop/prepend/take/reverse/shift', () => {
        expect(Arr.pop([1,2,3])).toEqual([1,2])
        expect(Arr.prepend([2,3], 0, 1)).toEqual([0,1,2,3])
        expect(Arr.take(0, [1,2,3])).toEqual([])
        expect(Arr.take(2, [1,2,3])).toEqual([1,2])
        expect(Arr.reverse([1,2,3])).toEqual([3,2,1])
        const [shifted, rest] = Arr.shift([1,2,3])
        expect(shifted).toBe(1)
        expect(rest).toEqual([2,3])
    })

    test('range/flatten', () => {
        expect(Arr.range(3)).toEqual([0,1,2])
        expect(Arr.range(3, 5)).toEqual([5,6,7])
        expect(Arr.range(0)).toEqual([])
        expect(Arr.flatten([1,[2,[3]],4])).toEqual([1,2,3,4])
    })
})
