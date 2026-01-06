import { baseConfig } from '../../tsdown.config'
import { defineConfig } from 'tsdown'

export default defineConfig({
    ...baseConfig,
    clean: true,
    entry: {
        index: 'src/index.ts',
        facades: 'src/Facades/index.ts',
    },
})
