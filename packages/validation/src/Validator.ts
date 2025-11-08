import { BaseClass, CustomRules } from './Contracts/RuleBuilder'
import { DotPaths, MessagesForRules, RulesForData } from './Contracts/ValidatorContracts'
import { Validator as SimpleBodyValidator, make, register, setTranslationObject } from 'simple-body-validator'

import { ExtendedRules } from './Rules/ExtendedRules'
import { MessageBag } from './utilities/MessageBag'
import { RuleSet } from './Contracts/ValidationRuleName'
import { ValidationException } from './ValidationException'
import { ValidationRule } from './ValidationRule'

register('telephone', function (value) {
    return /^\d{3}-\d{3}-\d{4}$/.test(value)
})

export class Validator<
    D extends Record<string, any>,
    R extends RulesForData<D>
> {
    #messages: Partial<Record<MessagesForRules<R>, string>>
    #after: (() => void)[] = []

    private data: D
    private rules: R
    private _errors: MessageBag
    private passing: boolean = false
    private executed: boolean = false
    private instance?: SimpleBodyValidator
    private errorBagName = 'default'
    private registeredCustomRules: CustomRules[] = [
        new ExtendedRules()
    ]
    private shouldStopOnFirstFailure = false

    constructor(
        data: D,
        rules: R,
        messages: Partial<Record<MessagesForRules<R>, string>> = {}
    ) {
        this.data = data
        this.rules = rules
        this.#messages = messages
        this._errors = new MessageBag()
        this.bindServices()
    }

    /**
     * Validate the data and return the instance
     */
    static make<
        D extends Record<string, any>,
        R extends RulesForData<D>
    > (
        data: D,
        rules: R,
        messages: Partial<Record<MessagesForRules<R>, string>> = {}
    ) {
        return new Validator(data, rules, messages)
    }

    /**
     * Run the validator and store results.
     */
    public async passes (): Promise<boolean> {
        if (this.executed) return this._errors.isEmpty()

        const exec = (await this.execute())

        // Let's spin through all the "after" hooks on this validator and ire them off. 
        for (const after of this.#after) {
            after()
        }

        return exec.passing
    }

    /**
     * Opposite of passes()
     */
    public async fails (): Promise<boolean> {
        return !(await this.passes())
    }

    /**
     * Throw if validation fails, else return executed data
     * 
     * @throws ValidationException if validation fails
     */
    public async validate (): Promise<Record<string, any>> {
        const ok = await this.passes()

        if (!ok) {
            throw new ValidationException(this, JSON.stringify(this._errors.toArray()))
        }

        return this.validatedData()
    }

    /**
     * Run the validator's rules against its data.
     * @param bagName 
     * @returns 
     */
    async validateWithBag (bagName: string) {
        this.errorBagName = bagName
        return this.validate()
    }

    /**
     * Stop validation on first failure.
     */
    stopOnFirstFailure () {
        this.shouldStopOnFirstFailure = true
        return this
    }


    /**
     * Get the data that passed validation.
     */
    public validatedData (): Record<string, any> {
        const validKeys = Object.keys(this.rules)
        const clean: Record<string, any> = {}
        for (const key of validKeys) {
            if (this.data[key] !== undefined) clean[key] = this.data[key]
        }
        return clean
    }


    /**
     * Return all validated input.
     */
    validated (): Partial<D> {
        return Object.fromEntries(
            Object.entries(this.data).filter(([key]) => key in this.rules)
        ) as Partial<D>
    }

    /**
     * Return a portion of validated input
     */
    safe () {
        const validated = this.validated()

        return {
            only: (keys: string[]) =>
                Object.fromEntries(Object.entries(validated).filter(([key]) => keys.includes(key))) as Partial<D>,
            except: (keys: string[]) =>
                Object.fromEntries(Object.entries(validated).filter(([key]) => !keys.includes(key))) as Partial<D>,
        }
    }

    /**
     * Get the message container for the validator.
     */
    public async messages () {
        if (!this.#messages) {
            await this.passes()
        }

        return this.#messages
    }

    /**
     * Add an after validation callback.
     *
     * @param  callback
     */
    public after<C extends ((validator: Validator<D, R>) => void) | BaseClass> (callback: C | C[]) {

        if (Array.isArray(callback)) {
            for (const rule of callback as any[]) {
                this.#after.push(() => rule.toString().startsWith('class') ? new rule(this) : rule(this))
            }
        } else if (typeof callback === 'function') {
            this.#after.push(() => callback(this))
        }

        return this
    }


    /**
     * Get all errors.
     */
    public errors (): MessageBag {
        return this._errors
    }

    public errorBag () {
        return this.errorBagName
    }

    /**
     * Reset validator with new data.
     */
    public setData (data: D): this {
        this.data = data
        this.executed = false
        return this
    }

    /**
     * Set validation rules.
     */
    public setRules (rules: R): this {
        this.rules = rules
        this.executed = false
        return this
    }

    /**
     * Add a single rule to existing rules.
     */
    public addRule (key: DotPaths<D>, rule: RuleSet): this {
        this.rules[key as never] = rule as never
        return this
    }

    /**
     * Merge additional rules.
     */
    public mergeRules (rules: Record<string, string>): this {
        this.rules = { ...this.rules, ...rules }
        return this
    }

    /**
     * Get current data.
     */
    public getData (): Record<string, any> {
        return this.data
    }

    /**
     * Get current rules.
     */
    public getRules (): R {
        return this.rules
    }

    /**
     * Bind all required services here.
     */
    private bindServices () {
        /**
         * Register all custom rules
         */
        for (const reged of this.registeredCustomRules) {
            if (reged instanceof ValidationRule) {
                if (reged.setData) reged.setData(this.data)
                if (reged.setValidator) reged.setValidator(this)
                for (const rule of reged.rules) {
                    register(rule.name, rule.validator)
                    if (rule.message) {
                        setTranslationObject({
                            en: {
                                [rule.name]: rule.message,
                            }
                        })
                    }
                }
            }
        }
        return this
    }

    private async execute () {
        const instance = make()
            .setData(this.data)
            .setRules(this.rules as never)
            .setCustomMessages(this.#messages)
            .stopOnFirstFailure(this.shouldStopOnFirstFailure)

        this.passing = await instance.validateAsync()

        this.executed = true
        this.instance = instance

        if (!this.passing) {
            this._errors = new MessageBag(instance.errors().all())
        }

        return this
    }
}