import 'reflect-metadata'

import { ConsoleServiceProvider, Kernel } from "@h3ravel/console";

import { Application } from '@h3ravel/core';
import { EventEmitter } from 'node:events';
import providers from './bootstrap/providers';

const app = new Application(process.cwd())

app.registerProviders(providers.concat([
    ConsoleServiceProvider
]))

await app.registerConfiguredProviders()
await app.boot()

new Kernel(app)

new EventEmitter().once('SIGINT', () => process.exit(0));
