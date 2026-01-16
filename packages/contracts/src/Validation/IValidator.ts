import type { DotPaths, MessagesForRules, RulesForData } from './ValidatorContracts'

import type { BaseValidationRuleClass } from './RuleBuilder'
import type { IMessageBag } from './IMessageBag'
import type { ValidationRuleSet } from './ValidationRuleName'

export declare class IValidator<
    D extends Record<string, any> = any,
    R extends RulesForData<D> = RulesForData<D>
> {
    constructor(
        data: D,
        rules: R,
        messages: Partial<Record<MessagesForRules<R>, string>>
    )

    /**
     * Validate the data and return the instance
     */
    static make<
        D extends Record<string, any>,
        R extends RulesForData<D>
    > (
        data: D,
        rules: R,
        messages: Partial<Record<MessagesForRules<R>, string>>
    ): IValidator<D, R>

    /**
     * Run the validator and store results.
     */
    public passes (): Promise<boolean>

    /**
     * Opposite of passes()
     */
    public fails (): Promise<boolean>

    /**
     * Throw if validation fails, else return executed data
     * 
     * @throws ValidationException if validation fails
     */
    public validate (): Promise<Record<string, any>>

    /**
     * Run the validator's rules against its data.
     * @param bagName 
     * @returns 
     */
    validateWithBag (bagName: string): Promise<Record<string, any>>

    /**
     * Stop validation on first failure.
     */
    stopOnFirstFailure (): this

    /**
     * Get the data that passed validation.
     */
    public validatedData (): Record<string, any>

    /**
     * Return all validated input.
     */
    validated (): Partial<D>

    /**
     * Return a portion of validated input
     */
    safe (): {
        only: (keys: string[]) => Partial<D>;
        except: (keys: string[]) => Partial<D>;
    }

    /**
     * Get the message container for the validator.
     */
    // public messages (): Promise<any>
    public messages (): Promise<Partial<Record<MessagesForRules<R>, string>>>

    /**
     * Add an after validation callback.
     *
     * @param  callback
     */
    public after<C extends ((validator: IValidator<D, R>) => void) | BaseValidationRuleClass> (callback: C | C[]): this

    /**
     * Get all errors.
     */
    public errors (): IMessageBag

    public errorBag (): string

    /**
     * Reset validator with new data.
     */
    public setData (data: D): this

    /**
     * Set validation rules.
     */
    public setRules (rules: R): this

    /**
     * Add a single rule to existing rules.
     */
    public addRule (key: DotPaths<D>, rule: ValidationRuleSet): this

    /**
     * Merge additional rules.
     */
    public mergeRules (rules: Record<string, string>): this

    /**
     * Get current data.
     */
    public getData (): Record<string, any>

    /**
     * Get current rules.
     */
    public getRules (): R
}