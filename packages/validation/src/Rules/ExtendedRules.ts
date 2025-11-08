import { DateTime } from '@h3ravel/support'
import type { RuleCallable } from '../Contracts/RuleBuilder'
import { ValidationRule } from '../ValidationRule'
import { Validator } from '../Validator'

export class ExtendedRules extends ValidationRule {
    /**
     * The validator instance.
     */
    protected validator!: Validator<any, any>

    public setValidator (validator: Validator<any, any>): this {
        this.validator = validator
        return this
    }

    rules: RuleCallable[] = [
        {

            name: 'hex',
            validator: (value: any) => {
                if (typeof value !== 'string') return false
                return /^[0-9a-fA-F]+$/.test(value.replace('#', ''))
            },
            message: 'The :attribute must be a valid hexadecimal string.'
        },
        {
            name: 'includes',
            validator: (value: any, parameters: string[] = []) => {
                if (value == null) return false

                if (Array.isArray(value)) {
                    return parameters.some(param => value.includes(param))
                }

                if (typeof value === 'string') {
                    return parameters.some(param => value.includes(param))
                }

                return false
            },
            message: 'The :attribute must include one of the following values: :values.'
        },
        {
            name: 'not_includes',
            validator: (value: any, parameters: string[] = []) => {
                if (value == null) return true

                if (Array.isArray(value)) {
                    return parameters.every(param => !value.includes(param))
                }

                if (typeof value === 'string') {
                    return parameters.every(param => !value.includes(param))
                }

                return true
            },
            message: 'The :attribute must not include any of the following values: :values.'
        },
        {
            name: 'datetime',
            validator: (value: any, parameters: string[] = [], attr) => {
                console.log(this.data, attr)
                if (typeof value !== 'string') return false
                const [format] = parameters

                if (!format) {
                    return !isNaN(Date.parse(value))
                }

                try {
                    return new DateTime(value, format, true).isValid()
                } catch {
                    return !isNaN(Date.parse(value))
                }
            },
            message: 'The :attribute must be a valid date matching the format :format.'
        },
        {
            name: 'exists',
            validator: async (value: any, parameters: string[] = []) => {
                const [tab, column, ignore] = parameters
                try {
                    const { DB } = await import(('@h3ravel/database'))
                    const [conn, table] = tab.split('.')
                    const query = DB.instance(table && conn ? conn : 'default').table(table && conn ? table : conn)
                    if (ignore) {
                        query.whereNot(column, ignore)
                    }

                    return await query.where(column, value).exists()
                } catch {
                    return false
                }
            },
            message: 'The :attribute does not exist.'
        },
        {
            name: 'unique',
            validator: async (value: any, parameters: string[] = []) => {
                const [tab, column, ignore] = parameters
                try {
                    const { DB } = await import(('@h3ravel/database'))
                    const [conn, table] = tab.split('.')
                    const query = DB.instance(table && conn ? conn : 'default').table(table && conn ? table : conn)
                    if (ignore) {
                        query.whereNot(column, ignore)
                    }

                    return !(await query.where(column, value).exists())
                } catch {
                    return false
                }
            },
            message: 'The :attribute does not exist.'
        },
    ]
    validate () { }
}