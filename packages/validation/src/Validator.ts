import { DotPaths, MessagesForRules, RulesForData } from './Contracts/ValidatorContracts'
import { Validator as SimpleBodyValidator, make } from 'simple-body-validator'

import { MessageBag } from './utilities/MessageBag'
import { RuleSet } from './Contracts/ValidationRuleName'
import { ValidationException } from './ValidationException'

export class Validator<
    D extends Record<string, any>,
    R extends RulesForData<D>
> {
    #messages: Partial<Record<MessagesForRules<R>, string>>

    private data: D
    private rules: R
    private _errors: MessageBag
    private passing: boolean = false
    private executed: boolean = false
    private instance?: SimpleBodyValidator
    private errorBagName = 'default'
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

        return (await this.execute()).passing
    }

    /**
     * Opposite of passes()
     */
    public async fails (): Promise<boolean> {
        return !(await this.passes())
    }

    /**
     * Throw if validation fails, else return executed data
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