import { baseConfig } from '../../tsdown.config'
import { defineConfig } from 'tsdown'

export default defineConfig({
    ...baseConfig,
    entry: {
        index: 'src/index.ts',
        facades: 'src/Facades/index.ts',
        commands: 'src/Commands/StorageLinkCommand.ts',
    },
    exports: true,
    format: 'esm',
    sourcemap: false,
    dts: true,
    clean: true,
    outDir: 'dist',
    outExtensions (ctx) {
        return {
            'js': ctx.format === 'cjs' ? '.cjs' : '.js',
            'd.ts': '.ts',
        }
    }
})
