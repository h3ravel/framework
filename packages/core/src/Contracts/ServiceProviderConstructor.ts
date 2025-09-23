/// <reference path="../app.globals.d.ts" />

import { Application, ServiceProvider } from '..'

import { IServiceProvider } from '@h3ravel/shared'

export type ServiceProviderConstructor = (new (app: Application) => ServiceProvider) & IServiceProvider;
