import type In from 'simple-body-validator/lib/cjs/rules/in'
import type NotIn from 'simple-body-validator/lib/cjs/rules/notIn'
import type Regex from 'simple-body-validator/lib/cjs/rules/regex'
import type RequiredIf from 'simple-body-validator/lib/cjs/rules/requiredIf'
import { Rule } from 'simple-body-validator'

export type ParamableRuleName =
    | 'accepted_if'
    | 'after'
    | 'after_or_equal'
    | 'before'
    | 'before_or_equal'
    | 'between'
    | 'date_equals'
    | 'declined_if'
    | 'digits_between'
    | 'different'
    | 'ends_with'
    | 'gt'
    | 'gte'
    | 'in'
    | 'lt'
    | 'lte'
    | 'max'
    | 'min'
    | 'not_in'
    | 'required_if'
    | 'required_unless'
    | 'required_with'
    | 'required_with_all'
    | 'required_without'
    | 'required_without_all'
    | 'same'
    | 'size'
    | 'starts_with'

export type PlainRuleName =
    | 'accepted'
    | 'alpha'
    | 'alpha_dash'
    | 'alpha_num'
    | 'array'
    | 'array_unique'
    | 'bail'
    | 'boolean'
    | 'confirmed'
    | 'date'
    | 'declined'
    | 'digits'
    | 'email'
    | 'integer'
    | 'json'
    | 'not_regex'
    | 'nullable'
    | 'numeric'
    | 'object'
    | 'present'
    | 'regex'
    | 'required'
    | 'sometimes'
    | 'string'
    | 'url'
    | 'uuid'

export type ValidationRuleName = ParamableRuleName | PlainRuleName

type MethodRules = Regex | In | NotIn | RequiredIf

/**
 * Single rule value (supports autocomplete + arbitrary strings + Rule instances)
 */
type RuleName = ValidationRuleName | `${ParamableRuleName}:${string}` | Rule | MethodRules

export type RuleSet =
    | RuleName
    | RuleName[]
    | `${ValidationRuleName}${string & `|${string}`}`