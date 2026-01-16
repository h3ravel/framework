import { CallableConstructor, ResourceOptions, RouteActions, RouteMethod } from '../Utilities/Utilities'

import { IController } from '../Core/IController'
import { IPendingResourceRegistration } from './IPendingResourceRegistration'
import { IPendingSingletonResourceRegistration } from './IPendingSingletonResourceRegistration'
import { IRoute } from './IRoute'

export abstract class IRouteRegistrar {
    abstract attribute (key: string, value: any): this;
    abstract resource<C extends typeof IController> (name: string, controller: C, options?: ResourceOptions): IPendingResourceRegistration;
    abstract apiResource<C extends typeof IController> (name: string, controller: C, options?: ResourceOptions): IPendingResourceRegistration;
    abstract singleton<C extends typeof IController> (name: string, controller: C, options?: ResourceOptions): IPendingSingletonResourceRegistration;
    abstract apiSingleton<C extends typeof IController> (name: string, controller: C, options?: ResourceOptions): IPendingSingletonResourceRegistration;
    abstract group (callback: CallableConstructor | any[] | string): this;
    abstract match (methods: RouteMethod | RouteMethod[], uri: string, action?: RouteActions): IRoute;
    abstract middleware (): any[];
    abstract middleware (middleware?: string | string[]): this;
    abstract prefix (prefix: string): this;
}