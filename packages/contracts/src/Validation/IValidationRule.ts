import type { ValidationRuleCallable } from './RuleBuilder'

export declare abstract class IValidationRule {
    rules: ValidationRuleCallable[]
    /**
     * Run the validation rule.
     */
    abstract validate (attribute: string, value: any, fail: (msg: string) => any): void
    /**
     * Set the current validator.
     */
    // public setValidator?(validator: IValidator<D, R>): this
    /**
     * Set the data under validation.
     */
    public setData (_data: Record<string, any>): this

    passes (value: any, attribute: string): boolean | Promise<boolean>
}