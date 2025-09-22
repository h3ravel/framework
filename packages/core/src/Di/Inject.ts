export function Inject (...dependencies: string[]) {
    return function (target: any) {
        target.__inject__ = dependencies;
    };
}

/**
 * Allows binding dependencies to both class and class methods 
 * 
 * @returns 
 */
export function Injectable (): ClassDecorator & MethodDecorator {
    return (...args: any[]) => {
        if (args.length === 1) {
            void args[0]; // class target
        }
        if (args.length === 3) {
            void args[0]; // target
            void args[1]; // propertyKey
            void args[2]; // descriptor
        }
    };
}

// export function Injectable (): MethodDecorator & ClassDecorator {
//     return ((_target: any, _propertyKey?: string, descriptor?: PropertyDescriptor) => {
//         if (descriptor) {
//             const original = descriptor.value;
//             descriptor.value = async function (...args: any[]) {
//                 const resolvedArgs = await Promise.all(args);
//                 return original.apply(this, resolvedArgs);
//             };
//         }
//     }) as any;
// }
