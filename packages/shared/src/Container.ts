export const INTERNAL_METHODS = Symbol('internal_methods')

/**
 * Decorator to mark class properties as internal
 * 
 * @param target 
 * @param propertyKey 
 */
export const internal = (target: any, propertyKey: string) => {
    if (!target[INTERNAL_METHODS]) {
        target[INTERNAL_METHODS] = new Set<string>()
    }
    target[INTERNAL_METHODS].add(propertyKey)
}

/**
 * Checks if a property is decorated with the &#64;internal decorator
 * 
 * @param instance 
 * @param prop 
 * @returns 
 */
export const isInternal = (instance: any, prop: string) => {
    const proto = Object.getPrototypeOf(instance)
    const internalSet: Set<string> = proto[INTERNAL_METHODS]
    return internalSet?.has(prop) ?? false
}