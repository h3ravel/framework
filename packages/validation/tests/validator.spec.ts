import { describe, expect, it } from 'vitest'

import { ValidationException } from '../src/ValidationException'
import { Validator } from '../src/Validator'

describe('Validator', () => {
    describe('basic rules', () => {

        it('throws ValidationException for invalid email', async () => {
            const validator = new Validator(
                { email: 'invalid-email' },
                { email: 'required|email' }
            )

            await expect(validator.validate()).rejects.toThrowError(ValidationException)
        })

        it('passes validation for valid data', async () => {
            const validator = new Validator(
                { email: 'valid@example.com', name: 'John' },
                { email: 'required|email', name: 'required|min:2|max:10' }
            )

            const result = await validator.passes()
            expect(result).toBe(true)
            expect(validator.errors().isEmpty()).toBe(true)
        })

        it('fails validation when required field is missing', async () => {
            const validator = new Validator({}, { name: 'required' })

            await expect(validator.validate()).rejects.toThrowError(ValidationException)
        })

        it('applies multiple rules correctly', async () => {
            const validator = new Validator(
                { name: 'A' },
                { name: 'required|min:2|max:5' }
            )

            await expect(validator.validate()).rejects.toThrowError(ValidationException)
        })
    })

    describe('advanced rules', () => {

        it('validates numeric and min/max values', async () => {
            const validator = new Validator(
                { age: 15 },
                { age: 'required|numeric|min:18|max:60' }
            )

            await expect(validator.validate()).rejects.toThrowError(ValidationException)
        })

        it('passes when numeric is in valid range', async () => {
            const validator = new Validator(
                { age: 25 },
                { age: 'required|numeric|min:18|max:60' }
            )

            const result = await validator.passes()
            expect(result).toBe(true)
        })

        it('validates boolean values', async () => {
            const validator = new Validator(
                { active: 'yes' },
                { active: 'boolean' },
            )

            await expect(validator.validate()).rejects.toThrowError(ValidationException)
        })
    })

    describe('arrays and nested data', () => {

        it('validates wildcard array elements', async () => {
            const validator = new Validator(
                { users: [{ email: 'bad' }, { email: 'good@example.com' }] },
                { 'users.*.email': 'required|email', },
                { 'users.*.email.required': 'Hello' }
            )

            await expect(validator.validate()).rejects.toThrowError(ValidationException)
        })

        it('validates nested object fields', async () => {
            const validator = new Validator(
                { user: { name: { first: '', last: 'Doe' } } },
                { 'user.name.first': 'required|min:2', 'user.name.last': 'required|min:2' }
            )

            await expect(validator.validate()).rejects.toThrowError(ValidationException)
        })

        it('passes with valid nested fields', async () => {
            const validator = new Validator(
                { user: { name: { first: 'John', last: 'Doe' } } },
                { 'user.name.first': 'required|min:2', 'user.name.last': 'required|min:2' }
            )

            const result = await validator.passes()
            expect(result).toBe(true)
        })
    })

    describe('custom messages', () => {
        it('uses custom error messages', async () => {
            const validator = new Validator(
                { email: '' },
                { email: 'required|email' },
                { 'email.required': 'Email is required!' }
            )

            await expect(validator.validate()).rejects.toThrowError(ValidationException)
            try {
                await validator.validate()
            } catch (error: any) {
                expect(error.errors().email[0]).toBe('Email is required!')
            }
        })
    })

    describe('optional and nullable', () => {
        it('passes when optional field is missing', async () => {
            const validator = new Validator({}, { nickname: 'nullable|min:2' })
            const result = await validator.passes()
            expect(result).toBe(true)
        })

        it('fails when nullable field is provided but invalid', async () => {
            const validator = new Validator({ nickname: 'A' }, { nickname: 'nullable|min:2' })
            await expect(validator.validate()).rejects.toThrowError(ValidationException)
        })
    })

    describe('error structure and message', () => {
        it('provides a structured errors object', async () => {
            const validator = new Validator({ email: '' }, { email: 'required|email' })
            try {
                await validator.validate()
            } catch (error: any) {
                expect(error).toBeInstanceOf(ValidationException)
                expect(typeof error.errors()).toBe('object')
                expect(error.errors().email).toBeInstanceOf(Array)
                expect(error.errors().email.length).toBeGreaterThan(0)
            }
        })

        it('throws with proper message', async () => {
            const validator = new Validator({ name: '' }, { name: 'required' })
            await expect(validator.validate()).rejects.toThrow('The name field is required.')
        })
    })

    describe('integration-like behavior', () => {
        it('can be reused with different data', async () => {
            const validator = new Validator(
                { email: 'invalid' },
                { email: 'required|email' }
            )

            await expect(validator.validate()).rejects.toThrowError(ValidationException)

            validator.setData({ email: 'valid@example.com' })
            const result = await validator.passes()
            expect(result).toBe(true)
        })
    })
})