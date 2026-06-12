import { testApp, TestApplication, type TestClient } from '@h3ravel/foundation'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, it } from 'vitest'

const basePath = fileURLToPath(new URL('..', import.meta.url))

describe('basic app HTTP testing', () => {
    let client: TestClient

    beforeAll(async () => {
        const app = await new TestApplication().init(basePath)
        client = await testApp(app)
    })

    it('loads API routes with their configured prefix', async () => {
        await client
            .get('/api/hello')
            .expect(200)
            .expect('Hello')
    })

    it('returns the normalized response for a defined route', async () => {
        const response = await client.get<string>('/api/hello')

        await client
            .get('/api/hello?source=testing')
            .expect(200)
            .expect(/^Hello$/)

        if (!response.ok || response.body !== 'Hello') {
            throw new Error('The basic app hello route did not return the expected response.')
        }
    })
})
