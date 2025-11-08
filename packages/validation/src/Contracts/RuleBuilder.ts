import type { ValidationRule } from '../ValidationRule'

export interface RuleCallable {
    name: string;
    validator: (value: any, parameters?: string[], attribute?: string) => boolean | Promise<boolean>;
    message?: string
}

export type CustomRules = ValidationRule | RuleCallable

export declare class BaseClass { }