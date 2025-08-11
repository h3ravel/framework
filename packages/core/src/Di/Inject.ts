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
