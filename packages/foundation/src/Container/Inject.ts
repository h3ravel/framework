export function Inject (...dependencies: string[]) {
    return function (target: any) {
        target.__inject__ = dependencies
    }
}

/**
 * Allows binding dependencies to both class and class methods 
 * 
 * @returns 
 */
export function Injectable (): MethodDecorator & ClassDecorator {
    return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor): any => {
        if (descriptor) {
            const original = descriptor.value
            descriptor.value = async function (...args: any[]) {
                const resolvedArgs = await Promise.all(args)
                return original.apply(this, resolvedArgs)
            }
            descriptor.value.__ownerClass = target.constructor
            return descriptor
        }
    }
}

// export function Injectable (): MethodDecorator & ClassDecorator {
//     return ((_target: any, _propertyKey?: string, descriptor?: PropertyDescriptor) => {
//         if (descriptor) {
//             const original = descriptor.value
//             descriptor.value = async function (...args: any[]) {
//                 const resolvedArgs = await Promise.all(args)
//                 return original.apply(this, resolvedArgs)
//             }
//         }
//     }) as any
// }

