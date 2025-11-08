import { beforeAll, describe, expect, it } from 'vitest'

import { ValidationException } from '../src/ValidationException'
import { Validator } from '../src/Validator'

describe('Validator', () => {
    describe('basic rules', () => {

        it('throws ValidationException for invalid email', async () => {
            const v = new Validator(
                { email: 'invalid-email' },
                { email: 'required|email' }
            )

            await expect(v.validate()).rejects.toThrowError(ValidationException)
        })

        it('passes validation for valid data', async () => {
            const v = new Validator(
                { email: 'valid@example.com', name: 'John' },
                { email: 'required|email', name: 'required|min:2|max:10' }
            )

            const result = await v.passes()
            expect(result).toBe(true)
            expect(v.errors().isEmpty()).toBe(true)
        })

        it('fails validation when required field is missing', async () => {
            const v = new Validator({}, { name: 'required' })

            await expect(v.validate()).rejects.toThrowError(ValidationException)
        })

        it('applies multiple rules correctly', async () => {
            const v = new Validator(
                { name: 'A' },
                { name: 'required|min:2|max:5' }
            )

            await expect(v.validate()).rejects.toThrowError(ValidationException)
        })
    })

    describe('advanced rules', () => {

        it('validates numeric and min/max values', async () => {
            const v = new Validator(
                { age: 15 },
                { age: 'required|numeric|min:18|max:60' }
            )

            await expect(v.validate()).rejects.toThrowError(ValidationException)
        })

        it('passes when numeric is in valid range', async () => {
            const v = new Validator(
                { age: 25 },
                { age: 'required|numeric|min:18|max:60' }
            )

            const result = await v.passes()
            expect(result).toBe(true)
        })

        it('validates boolean values', async () => {
            const v = new Validator(
                { active: 'yes' },
                { active: 'boolean' },
            )

            await expect(v.validate()).rejects.toThrowError(ValidationException)
        })
    })

    describe('arrays and nested data', () => {

        it('validates wildcard array elements', async () => {
            const v = new Validator(
                { users: [{ email: 'bad' }, { email: 'good@example.com' }] },
                { 'users.*.email': 'required|email', },
                { 'users.*.email.required': 'Hello' }
            )

            await expect(v.validate()).rejects.toThrowError(ValidationException)
        })

        it('validates nested object fields', async () => {
            const v = new Validator(
                { user: { name: { first: '', last: 'Doe' } } },
                { 'user.name.first': 'required|min:2', 'user.name.last': 'required|min:2' }
            )

            await expect(v.validate()).rejects.toThrowError(ValidationException)
        })

        it('passes with valid nested fields', async () => {
            const v = new Validator(
                { user: { name: { first: 'John', last: 'Doe' } } },
                { 'user.name.first': 'required|min:2', 'user.name.last': 'required|min:2' }
            )

            const result = await v.passes()
            expect(result).toBe(true)
        })
    })

    describe('custom messages', () => {
        it('uses custom error messages', async () => {
            const v = new Validator(
                { email: '' },
                { email: 'required|email' },
                { 'email.required': 'Email is required!' }
            )

            await expect(v.validate()).rejects.toThrowError(ValidationException)
            try {
                await v.validate()
            } catch (error: any) {
                expect(error.errors().email[0]).toBe('Email is required!')
            }
        })
    })

    describe('optional and nullable', () => {
        it('passes when optional field is missing', async () => {
            const v = new Validator({}, { nickname: 'nullable|min:2' })
            const result = await v.passes()
            expect(result).toBe(true)
        })

        it('fails when nullable field is provided but invalid', async () => {
            const v = new Validator({ nickname: 'A' }, { nickname: 'nullable|min:2' })
            await expect(v.validate()).rejects.toThrowError(ValidationException)
        })
    })

    describe('error structure and message', () => {
        it('provides a structured errors object', async () => {
            const v = new Validator({ email: '' }, { email: 'required|email' })
            try {
                await v.validate()
            } catch (error: any) {
                expect(error).toBeInstanceOf(ValidationException)
                expect(typeof error.errors()).toBe('object')
                expect(error.errors().email).toBeInstanceOf(Array)
                expect(error.errors().email.length).toBeGreaterThan(0)
            }
        })

        it('throws with proper message', async () => {
            const v = new Validator({ name: '' }, { name: 'required' })
            await expect(v.validate()).rejects.toThrow('The name field is required.')
        })
    })

    describe('integration-like behavior', () => {
        it('can be reused with different data', async () => {
            const v = new Validator(
                { email: 'invalid' },
                { email: 'required|email' }
            )

            await expect(v.validate()).rejects.toThrowError(ValidationException)

            v.setData({ email: 'valid@example.com' })
            const result = await v.passes()
            expect(result).toBe(true)
        })
    })

    describe('extended rules', () => {
        // let app: Application

        beforeAll(async () => {
            // const DatabaseServiceProvider = (await import(('@h3ravel/database'))).DatabaseServiceProvider
            // const HttpServiceProvider = (await import(('@h3ravel/http'))).HttpServiceProvider
            // const ConfigServiceProvider = (await import(('@h3ravel/config'))).ConfigServiceProvider
            // app = await h3ravel(
            //     [HttpServiceProvider, DatabaseServiceProvider, ConfigServiceProvider, ValidationServiceProvider],
            //     path.join(process.cwd(), 'packages/validation/tests'),
            //     {
            //         autoload: false,
            //         customPaths: {
            //             config: 'config'
            //         }
            //     })

            // // const { DB } = await import('@h3ravel/database')
            // // class User extends Model {
            // // }
            // console.log(app)
        })

        it('includes: should validate included item in the given list of values.', async () => {
            const v = new Validator(
                { choice: 'news' },
                { choice: 'includes:news,marketing' }
            )

            const result = await v.passes()
            expect(result).toBe(true)
        })

        it('hex: should validate hexadecimal format', async () => {
            const v = new Validator(
                { color: '#e1a88b' },
                { color: 'hex' }
            )

            const result = await v.passes()
            expect(result).toBe(true)
        })

        it('not_includes: should validate hexadecimal format', async () => {
            const v = new Validator(
                { choice: 'yam' },
                { choice: 'not_includes:fish,egg' }
            )

            const result = await v.passes()
            expect(result).toBe(true)
        })

        it('datetime: should validate datetime format', async () => {
            const v = new Validator(
                { date: '2025-07-07' },
                { date: 'string|datetime:YYYY-MM-DD' }
            )

            const result = await v.passes()
            expect(result).toBe(true)
        })

        // it('exists: the user should exist', async () => {
        //     const v = new Validator(
        //         { username: 'legacy' },
        //         { username: 'exists:users,username' }
        //     )

        //     const result = await v.passes()
        //     expect(result).toBe(true)
        // })
    })
})