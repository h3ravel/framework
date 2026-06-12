import { h3ravel } from '@h3ravel/core'
import { testApp, TestApplication, type TestClient } from '@h3ravel/foundation'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, it } from 'vitest'

import providers from '../src/bootstrap/providers'

const basePath = fileURLToPath(new URL('..', import.meta.url))

describe('basic app HTTP testing', () => {
    let client: TestClient

    beforeAll(async () => {
        const app = await h3ravel(providers, basePath, {
            autoload: true,
            initialize: false,
        })

        new TestApplication().configure(app, basePath)
        await app.boot()
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
