import { ClassConstructor } from '@h3ravel/contracts'

/**
 * Helper to convert a Union (A | B) into an Intersection (A & B)
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * Infers the mixed type of all base classes provided
 */
type MixedClass<T extends ClassConstructor[]> = UnionToIntersection<T[number]> &
    (new (...args: any[]) => UnionToIntersection<InstanceType<T[number]>>);

/**
 * Helper to mix multiple classes into one, this allows extending multiple classes by any single class
 * 
 * @param bases 
 * @returns 
 */
export const mix = <T extends ClassConstructor[]> (...bases: T): MixedClass<T> => {
    // This is the base class that will manage the lifecycle
    class Base {
        constructor(...args: any[]) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            let instance: Base = this

            for (const constructor of bases) {
                // Reflect.construct triggers the base constructor logic.
                // If the constructor returns a Proxy, 'result' will be that Proxy.
                const result = Reflect.construct(constructor, args, new.target)

                if (result && (typeof result === 'object' || typeof result === 'function')) {
                    // If a Proxy or object was returned, we merge existing properties 
                    // into it and make it our primary instance.
                    if (result !== instance) {
                        Object.assign(result, instance)
                        instance = result
                    }
                }
            }
            // Returning 'instance' here overrides the 'this' of the new ChildClass()
            return instance
        }
    }

    // Chain Statics and Prototypes
    for (let i = 0; i < bases.length; i++) {
        const currentBase = bases[i]
        const nextBase = bases[i + 1]

        // Copy prototype methods (for type inference and runtime access)
        Object.getOwnPropertyNames(currentBase.prototype).forEach(prop => {
            if (prop !== 'constructor') {
                Object.defineProperty(
                    Base.prototype,
                    prop,
                    Object.getOwnPropertyDescriptor(currentBase.prototype, prop)!
                )
            }
        })

        // Copy static methods on extended classes
        Object.getOwnPropertyNames(currentBase).forEach(prop => {
            if (!['prototype', 'name', 'length'].includes(prop)) {
                Object.defineProperty(
                    Base,
                    prop,
                    Object.getOwnPropertyDescriptor(currentBase, prop)!
                )
            }
        })

        // Link Prototype Chain (for X instanceof ParentClass)
        if (nextBase) {
            Object.setPrototypeOf(currentBase.prototype, nextBase.prototype)
            Object.setPrototypeOf(currentBase, nextBase)
        }
    }

    // Finally, link our internal Base to the head of the chain
    Object.setPrototypeOf(Base.prototype, bases[0].prototype)
    Object.setPrototypeOf(Base, bases[0])

    return Base as any
}