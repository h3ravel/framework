import { ImplicitRule as Rule } from 'simple-body-validator'
import type { ValidationRuleCallable } from '@h3ravel/contracts'
import type { Validator } from './Validator'

export abstract class ImplicitRule extends Rule {
    rules: ValidationRuleCallable[] = []

    /**
     * Run the validation rule.
     */
    abstract validate (attribute: string, value: any, fail: (msg: string) => any): void
    /**
     * Set the current validator.
     */
    public setValidator?(validator: Validator<any, any>): this
}