import { trait } from './TraitSystem'

/**
 * Wraps an object in a Proxy to emulate PHP magic methods.
 *
 * Supported:
 *  - __call(method, args)
 *  - __get(property)
 *  - __set(property, value)
 *  - __isset(property)
 *  - __unset(property)
 *
 * Called automatically by Magic's constructor.
 * 
 * Return in any class constructor to use
 * 
 * @param target 
 * @returns 
 */
export function makeMagic<T extends object> (target: T): T {
    return new Proxy(target, {
        /**
         * Intercepts property access and missing method calls.
         */
        get (obj, prop, receiver) {
            if (typeof prop === 'string') {
                // Real property / method: return normally
                if (prop in obj)
                    return Reflect.get(obj, prop, receiver)

                // Missing method: __call
                if ((obj as any).__call)
                    return (...args: any[]) => (obj as any).__call(prop, args)

                // Missing property: __get
                if ((obj as any).__get)
                    return (obj as any).__get(prop)
            }
            return undefined
        },

        /**
         * Intercepts property assignment.
         */
        set (obj, prop, value) {
            if (typeof prop === 'string' && (obj as any).__set) {
                ; (obj as any).__set(prop, value)
                return true
            }
            return Reflect.set(obj, prop, value)
        },

        /**
         * Intercepts `in` operator and existence checks.
         */
        has (obj, prop) {
            if (typeof prop === 'string' && (obj as any).__isset) {
                return (obj as any).__isset(prop)
            }
            return Reflect.has(obj, prop)
        },

        /**
         * Intercepts `delete obj.prop`.
         */
        deleteProperty (obj, prop) {
            if (typeof prop === 'string' && (obj as any).__unset) {
                ; (obj as any).__unset(prop)
                return true
            }
            return Reflect.deleteProperty(obj, prop)
        }
    })
}

/**
 * Wraps a class constructor in a Proxy to emulate static PHP magic methods.
 *
 * Supported:
 *  - __callStatic(method, args)
 *  - static __get(property)
 *  - static __set(property, value)
 *  - static __isset(property)
 *  - static __unset(property)
 * 
 * @param cls 
 * @returns 
 */
export function makeStaticMagic<T extends ((...args: any[]) => any) | (abstract new (...args: any[]) => any)> (cls: T): T {
    return new Proxy(cls, {
        /**
         * Intercepts static property access and missing static calls.
         */
        get (target, prop) {
            if (typeof prop === 'string') {
                // Real static property / method
                if (prop in target) {
                    return (target as any)[prop]
                }

                // Missing static method → __callStatic
                if ((target as any).__callStatic) {
                    return (...args: any[]) =>
                        (target as any).__callStatic(prop, args)
                }

                // Missing static property → __get
                if ((target as any).__get) {
                    return (target as any).__get(prop)
                }
            }
            return undefined
        },

        /**
         * Intercepts static property assignment.
         */
        set (target, prop, value) {
            if (typeof prop === 'string' && (target as any).__set) {
                ; (target as any).__set(prop, value)
                return true
            }
            return Reflect.set(target, prop, value)
        },

        /**
         * Intercepts `prop in Class`.
         */
        has (target, prop) {
            if (typeof prop === 'string' && (target as any).__isset) {
                return (target as any).__isset(prop)
            }
            return Reflect.has(target, prop)
        },

        /**
         * Intercepts `delete Class.prop`.
         */
        deleteProperty (target, prop) {
            if (typeof prop === 'string' && (target as any).__unset) {
                ; (target as any).__unset(prop)
                return true
            }
            return Reflect.deleteProperty(target, prop)
        }
    })
}

/**
 * Base class that enables PHP-style magic methods automatically.
 *
 * Any subclass may implement:
 *  - __call
 *  - __get
 *  - __set
 *  - __isset
 *  - __unset
 *
 * The constructor returns a Proxy transparently.
 */
export abstract class Magic {
    constructor() {
        return makeMagic(this)
    }
}


export const UseMagic = trait(Base => {
    return class Magic extends Base {
        constructor(...args: any[]) {
            super(...args)
            return makeMagic(this)
        }
    }
})