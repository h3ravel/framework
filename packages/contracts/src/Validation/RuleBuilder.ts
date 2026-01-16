import type { IValidationRule } from './IValidationRule'

export interface ValidationRuleCallable {
    name: string;
    validator: (value: any, parameters?: string[], attribute?: string) => boolean | Promise<boolean>;
    message?: string
}

export type CustomValidationRules = IValidationRule | ValidationRuleCallable

export declare class BaseValidationRuleClass { }