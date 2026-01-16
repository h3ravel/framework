export type ListenerClassConstructor = (new (...args: any) => any) & {
    subscribe?(...args: any[]): any
};

export type AppEvent = (...args: any[]) => any
export type AppListener = (...args: any[]) => any