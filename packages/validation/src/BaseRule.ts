import { Rule } from 'simple-body-validator'
import type { RuleCallable } from './Contracts/RuleBuilder'

export class BaseRule extends Rule {
    rules: RuleCallable[] = []
}