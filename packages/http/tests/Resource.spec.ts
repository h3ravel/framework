import { beforeAll, describe, it } from 'vitest'

import { h3ravel } from '@h3ravel/core'
import { testApp, TestApplication, type TestClient } from '@h3ravel/foundation'
import { HttpServiceProvider } from '@h3ravel/http'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const basePath = path.join(fileURLToPath(new URL('..', import.meta.url)), 'tests')
const providers = [
    HttpServiceProvider,
]

describe('Resource', () => {
    let client: TestClient
    const body = {
        data: {
            documentation: 'https://h3ravel.toneflix.net/introduction',
            performance: 'https://h3ravel.toneflix.net/#why-h3ravel',
            integration: 'https://h3ravel.toneflix.net/#why-h3ravel',
            features: 'https://h3ravel.toneflix.net/#features',
        },
        message: 'Resora is working',
    }

    beforeAll(async () => {
        const app = await h3ravel(providers, basePath, {
            autoload: true,
            initialize: false,
            filteredProviders: [
                'DatabaseServiceProvider',
            ]
        })

        new TestApplication().configure(app, basePath)
        await app.boot()
        client = await testApp(app)
    })

    it('returns a Resora collection directly', async () => {
        await client
            .get('/api')
            .expect(200)
            .expect({ ...body, data: [body.data, body.data, body.data] })
    })

    it('returns a Resora resource directly', async () => {
        await client
            .get('/api/show')
            .expect(200)
            .expect(body)
    })

    it('preserves customized Resora response status, headers, and body', async () => {
        await client
            .get('/api/customized')
            .expect(201)
            .expect('x-resora', 'active')
            .expect(body)
    })
})
