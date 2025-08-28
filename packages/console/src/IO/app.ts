import { Application } from '@h3ravel/core';
import providers from './providers';

export default class {
    async bootstrap () {
        const app = new Application(process.cwd())

        app.registerProviders(providers)

        await app.registerConfiguredProviders()
        await app.boot()
    }
}
