import { ImplicitRule as Rule } from 'simple-body-validator'
import type { RuleCallable } from './Contracts/RuleBuilder'
import { Validator } from './Validator'

export abstract class ImplicitRule extends Rule {
    rules: RuleCallable[] = []

    /**
     * Run the validation rule.
     */
    abstract validate (attribute: string, value: any, fail: (msg: string) => any): void
    /**
     * Set the current validator.
     */
    public setValidator?(validator: Validator<any, any>): this
}