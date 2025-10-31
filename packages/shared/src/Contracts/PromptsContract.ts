import { Separator } from '@inquirer/prompts'

export type Choice<Value> = {
    value: Value;
    name?: string;
    description?: string;
    short?: string;
    disabled?: boolean | string;
    type?: never;
};

export type Choices = readonly (string | Separator)[] | readonly (Separator | Choice<string>)[]