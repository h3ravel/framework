import { ValidationRule, ValidationServiceProvider } from '../src'
import { beforeAll, describe, expect, it } from 'vitest'

import { ValidationException } from '../src/ValidationException'
import { Validator } from '../src/Validator'
import { h3ravel } from '@h3ravel/core'
import path from 'node:path'

describe('Validator', () => {
    describe('basic rules', () => {

        it('throws ValidationException for invalid email', async () => {
            const v = new Validator(
                { email: 'invalid-email' },
                { email: 'required|email' }
            )

            await expect(v.validate()).rejects.toThrowError(ValidationException)
        })

        it('can run after callbacks', async () => {
            const v = new Validator(
                { email: 'valid@example.com', name: 'John' },
                { email: 'required|email', name: 'required|min:2|max:10' }
            )

            v.after((inst) => {
                expect(inst).toBeInstanceOf(Validator)
            })

            const result = await v.passes()
            expect(result).toBe(true)
            expect(v.errors().isEmpty()).toBe(true)
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
        beforeAll(async () => {
            const { DatabaseServiceProvider, DB, Model } = (await import('@h3ravel/database'))
            const { HttpServiceProvider } = (await import(('@h3ravel/http')))
            const { ConfigServiceProvider } = (await import(('@h3ravel/config')))
            await h3ravel(
                [HttpServiceProvider, DatabaseServiceProvider, ConfigServiceProvider, ValidationServiceProvider],
                path.join(process.cwd(), 'packages/validation/tests'),
                {
                    autoload: false,
                    customPaths: {
                        config: 'config'
                    }
                })

            await DB.instance().schema.hasTable('users').then((exists) => {
                if (!exists) {
                    return DB.instance().schema.createTable('users', (table: any) => {
                        table.increments('id')
                        table.string('username').nullable()
                        table.timestamps()
                    })
                } else {
                    return DB.instance().schema.alterTable('users', async (table: any) => {
                        if (!await DB.instance().schema.hasColumn('users', 'username')) {
                            table.string('username').nullable()
                        }
                    })
                }
            })

            class User extends Model { }
            await User.query().firstOrCreate({ 'username': 'legacy' })
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

        it('exists: the user should exist', async () => {
            const v = new Validator(
                { username: 'legacy' },
                { username: 'exists:users,username' }
            )

            const result = await v.passes()
            expect(result).toBe(true)
        })

        it('unique: the user should be unique', async () => {
            const v = new Validator(
                { username: 'kaylah' },
                { username: 'unique:users,username' }
            )

            const result = await v.passes()
            expect(result).toBe(true)
        })
    })

    describe('custom rules', () => {
        it('should fail if the fail callback is called', async () => {
            class CustomRule extends ValidationRule {
                validate (attribute: string, value: any, fail: (msg: string) => any): void {
                    if (value === 'H Legacy' && attribute === 'name') fail('custom message')
                }
            }

            const v = new Validator(
                { name: 'H Legacy' },
                { name: ['string', new CustomRule()] }
            )

            const result = await v.fails()
            expect(result).toBe(true)
            expect(v.errors().get('name')).toEqual(['custom message'])
        })

        it('should fail if the fail callback has not been called', async () => {
            class CustomRule extends ValidationRule {
                validate (): void {
                }
            }

            const v = new Validator(
                { name: 'H Legacy' },
                { name: ['string', new CustomRule()] }
            )

            const result = await v.passes()
            expect(result).toBe(true)
            expect(v.errors().get('name')).toEqual([])
        })

        it('should pass request data via the setData callback', async () => {
            const data = { name: 'H Legacy' }
            class CustomRule extends ValidationRule {
                validate (): void {
                    expect(this.data).toEqual(data)

                }
                setData (data: Record<string, any>): this {
                    this.data = data
                    return this
                }
            }

            const v = new Validator(data, { name: ['string', new CustomRule()] })

            const result = await v.passes()
            expect(result).toBe(true)
        })
    })
})