import { Application, Registerer } from '@h3ravel/core';

import providers from './providers';

export default class {
    async fire () {
        const app = new Application(process.cwd())

        new Registerer(app)

        app.registerProviders(providers)

        await app.registerConfiguredProviders()
        await app.boot()
    }
}
