// vite.base.config.ts
import type { UserConfig } from 'vite'
import dts from 'vite-plugin-dts'
import path from 'path'

const baseConfig: UserConfig = {
    build: {
        lib: {
            // This will be overridden per package
            entry: path.resolve(__dirname, 'src/index.ts'),
            formats: ['es', 'cjs'],
            fileName: (format) => `index.${format}.js`
        },
        sourcemap: true,
        rollupOptions: {
            external: [
                'h3',
                '@h3ravel/core',
                '@h3ravel/cache',
                '@h3ravel/console',
                '@h3ravel/database',
                '@h3ravel/support',
                '@h3ravel/mail',
                '@h3ravel/queue',
                '@h3ravel/router',
                '@h3ravel/http',
                '@h3ravel/config',
            ]
        }
    },
    plugins: [
        dts({
            insertTypesEntry: true
        })
    ]
}

export default baseConfig
