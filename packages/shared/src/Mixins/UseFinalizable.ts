/*
**  Extracted from @traits-ts/stdlib - Traits for TypeScript Classes: Standard Library
**  Copyright (c) 2025 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under MIT license <https://spdx.org/licenses/MIT>
*/

import { trait } from './TraitSystem'

/**
 * the central class instance registry
 */
const registry = new FinalizationRegistry((fn: () => void) => {
    if (typeof fn === 'function' && !(fn as any).finalized) {
        (fn as any).finalized = true
        fn()
    }
})

/**
 * the API trait "Finalizable<T>"
 */
export const Finalizable = trait((base) => class Finalizable extends base {
    constructor(...args: any[]) {
        super(...args)

        /*  register class instance  */
        const fn1 = this.$finalize
        if (typeof fn1 !== 'function')
            throw new Error('trait Finalizable requires a $finalize method to be defined')
        const fn2 = () => { fn1(this) }
        fn2.finalized = false
        registry.register(this, fn2, this)
    }
})
