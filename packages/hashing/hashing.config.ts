import { defineConfig } from '@h3ravel/hashing'

export default defineConfig({
    driver: 'bcrypt',
    bcrypt: {
        rounds: 12,
        verify: true,
        limit: null,
    },
    argon: {
        memory: 65536,
        threads: 1,
        time: 4,
        verify: true,
    },
})
