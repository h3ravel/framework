import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const basicAppSource = fileURLToPath(new URL('./examples/basic-app/src/', import.meta.url))

export default defineConfig({
    resolve: {
        alias: [
            { find: /^App\//, replacement: `${basicAppSource}app/` },
            { find: /^src\//, replacement: basicAppSource },
        ],
    },
    test: {
        include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**', '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*', '**/.h3ravel/**'],
        environment: 'node',
        root: './',
        passWithNoTests: true,
        coverage: {
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**', '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*', '**/.h3ravel/**'],
        }
    },
})
