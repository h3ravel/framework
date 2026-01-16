import type { Application, ServiceProvider } from '..'

import { IServiceProvider } from '@h3ravel/contracts'

export type ServiceProviderConstructor = (new (app: Application) => ServiceProvider) & IServiceProvider;

export type AServiceProvider = (new (_app: Application) => ServiceProvider) & Partial<ServiceProvider>
export type OServiceProvider = (new (_app: Application) => Partial<ServiceProvider>) & Partial<ServiceProvider>
