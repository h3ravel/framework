import { Application } from '@h3ravel/core';
import { ConsoleServiceProvider } from '@h3ravel/console'
import { execa } from 'execa';
import { glob } from 'node:fs/promises';
import path from 'node:path';
import preferredPM from 'preferred-pm';
import providers from './providers';

export default class {
    async fire () {

        const pm = (await preferredPM(process.cwd()))?.name ?? 'pnpm'

        const ENV_VARS = {
            EXTENDED_DEBUG: 'false',
            CLI_BUILD: 'true',
            NODE_ENV: 'development',
        }

        /** Build the library to avoid TS errors */
        await execa(
            pm,
            ['tsdown', '--silent', '--config-loader', 'unconfig', '-c', 'tsdown.default.config.ts'],
            { stdout: 'inherit', stderr: 'inherit', env: Object.assign({}, process.env, ENV_VARS) }
        );

        const app = new Application(process.cwd())

        /**
         * Service providers auto registration
         */
        const providers_path = app_path('Providers/*.js').replace('/src/', '/.h3ravel/serve/')

        /** Add the App Service Providers */
        for await (const provider of glob(providers_path)) {
            const name = path.basename(provider).replace('.js', '')
            try {
                providers.push((await import(provider))[name])
            } catch { /** */ }
        }

        /** Add the ConsoleServiceProvider */
        providers.push(ConsoleServiceProvider)

        /** Register all the Service Providers */
        app.registerProviders(providers)

        await app.registerConfiguredProviders()
        await app.boot()
    }
}
