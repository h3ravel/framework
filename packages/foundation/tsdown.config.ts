import { baseConfig } from '../../tsdown.config'
import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    ...baseConfig,
    copy: 'src/views',
  },
])
