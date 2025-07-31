// packages/core/vite.config.ts
import { defineConfig, mergeConfig } from 'vite'

import baseConfig from '../../vite.base.config'
import path from 'path'

export default mergeConfig(
    baseConfig,
    defineConfig({
        build: {
            lib: {
                entry: path.resolve(__dirname, 'src/index.ts'),
                name: 'H3ravelCore'
            }
        }
    })
)
