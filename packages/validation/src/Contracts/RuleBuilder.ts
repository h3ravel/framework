import type { BaseRule } from '../BaseRule'

export interface RuleCallable {
    name: string;
    validator: (value: any, parameters?: string[], attribute?: string) => boolean | Promise<boolean>;
    message?: string
}

export type CustomRules = BaseRule | RuleCallable