import { beforeAll, describe, expect, it } from 'vitest'
import { register, setTranslationObject } from 'simple-body-validator'

import { ValidationException } from '../src/ValidationException'
import { Validator } from '../src/Validator'

describe('Validator.make', () => {
    beforeAll(() => {

        setTranslationObject({
            en: {
                uuid: 'The :attribute must be a valid UUID.',
            }
        })

        register('uuid', (value) => /^[0-9a-f-]{36}$/i.test(value))
    })

    it('passes simple required rule', async () => {
        const v = Validator.make({ name: 'John' }, { name: 'required' })
        expect(await v.passes()).toBe(true)
    })

    it('fails when required field missing', async () => {
        const v = Validator.make({}, { name: 'required' })
        expect(await v.fails()).toBe(true)
    })

    it('supports multiple rules', async () => {
        const v = Validator.make({ email: 'foo@bar.com' }, { email: 'email' })
        expect(await v.passes()).toBe(true)
    })

    it('fails email validation', async () => {
        const v = Validator.make({ email: 'invalid' }, { email: 'email' })
        expect(await v.fails()).toBe(true)
    })

    it('stops on first failure when bail used', async () => {
        const v = Validator.make({ name: '' }, { name: 'bail|required|min:3' })
        expect(await v.fails()).toBe(true)
    })

    it('validates sometimes rule', async () => {
        const v = Validator.make({}, { name: 'sometimes|required' })
        expect(await v.passes()).toBe(true)
    })

    it('handles nullable rule', async () => {
        const v = Validator.make({ age: null }, { age: 'nullable|integer' })
        expect(await v.passes()).toBe(true)
    })

    it('validates custom uuid rule', async () => {
        const v = Validator.make({ id: '123e4567-e89b-12d3-a456-426614174000' }, { id: ['uuid'] })
        expect(await v.passes()).toBe(true)
    })

    it('fails invalid uuid', async () => {
        const v = Validator.make({ id: 'not-a-uuid' }, { id: 'uuid' })
        expect(await v.fails()).toBe(true)
    })

    it('validates different rule', async () => {
        const v = Validator.make({ password: '123', confirm: '456' }, { confirm: 'different:password' })
        expect(await v.passes()).toBe(true)
    })

    it('fails different rule when same', async () => {
        const v = Validator.make({ password: '123', confirm: '123' }, { confirm: 'different:password' })
        expect(await v.fails()).toBe(true)
    })

    it('reports all error messages', async () => {
        const v = Validator.make({ email: '' }, { email: 'required|email' })
        await expect(v.validate()).rejects.toThrowError(ValidationException)
        expect(Object.keys(v.errors().all()).length).toBeGreaterThan(0)
    })
})