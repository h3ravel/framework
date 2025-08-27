import { Application } from '@h3ravel/core';
import { EventEmitter } from 'node:events';
import { Kernel } from '../Kernel';
import providers from './providers';

export default class {
    async bootstrap () {
        const app = new Application(process.cwd())

        app.registerProviders(providers)

        await app.registerConfiguredProviders()
        await app.boot()

        new Kernel(app)

        new EventEmitter().once('SIGINT', () => process.exit(0));

        process.on("SIGINT", () => {
            process.exit(0);
        });
        process.on("SIGTERM", () => {
            process.exit(0);
        });
    }
}
