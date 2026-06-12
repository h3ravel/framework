import { H3, getQuery, readBody } from 'h3'
import { describe, expect, it } from 'vitest'

import type { Application } from '@h3ravel/core'
import { testApp } from '../src/Testing/testApp'

const createApplication = (h3App?: H3) => ({
    getH3App: () => h3App,
}) as Application

describe('testApp', () => {
    it('creates a Parasito client for the application H3 instance', async () => {
        const h3App = new H3()

        h3App.get('/health', (event) => {
            event.res.headers.set('x-test-suite', 'foundation')
            return {
                ok: true,
                query: getQuery(event),
            }
        })
        h3App.get('/ready', () => 'ready')

        const client = await testApp(createApplication(h3App))

        await client
            .get('/health')
            .query({ check: 'ready' })
            .expect(200)
            .expect('x-test-suite', 'foundation')
            .expect({
                ok: true,
                query: {
                    check: 'ready',
                },
            })

        await client
            .get('/ready')
            .expect(200)
            .expect('ready')
    })

    it('supports request bodies and custom response assertions', async () => {
        const h3App = new H3()

        h3App.post('/echo', async (event) => ({
            received: await readBody(event),
        }))

        const client = await testApp<{ received: { name: string } }>(createApplication(h3App))
        const response = await client
            .post('/echo')
            .send({ name: 'H3ravel' })
            .expect(200)
            .expect(({ body }) => {
                expect(body.received.name).toBe('H3ravel')
            })

        expect(response.ok).toBe(true)
    })

    it('fails clearly when the application has no H3 instance', async () => {
        await expect(testApp(createApplication())).rejects.toThrow(
            'Unable to create a test client because the application has no H3 instance.',
        )
    })
})
