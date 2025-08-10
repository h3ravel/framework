export function Inject (...dependencies: string[]) {
    return function (target: any) {
        target.__inject__ = dependencies;
    };
}


export function Injectable (): ClassDecorator {
    return (_arget) => { };
}
