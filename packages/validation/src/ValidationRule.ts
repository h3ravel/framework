import { Rule } from 'simple-body-validator'
import type { RuleCallable } from './Contracts/RuleBuilder'
import { Validator } from './Validator'

export abstract class ValidationRule extends Rule {
    rules: RuleCallable[] = []
    private passing: boolean = false

    /**
     * Run the validation rule.
     */
    abstract validate (attribute: string, value: any, fail: (msg: string) => any): void
    /**
     * Set the current validator.
     */
    public setValidator?(validator: Validator<any, any>): this
    /**
     * Set the data under validation.
     */
    public setData (_data: Record<string, any>): this { return this }

    passes (value: any, attribute: string): boolean | Promise<boolean> {
        this.passing = true
        this.validate(attribute, value, (message: string) => {
            this.message = message
            this.passing = false
        })
        return this.passing
    }
}