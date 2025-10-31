import autocomplete, { ChoiceOrSeparatorArray } from 'inquirer-autocomplete-standalone'
import { confirm, input, password, select } from '@inquirer/prompts'

import { Choices } from '../Contracts/PromptsContract'
import { Logger } from '..'

export class Prompts extends Logger {
    /**
     * Allows users to pick from a predefined set of choices when asked a question.
     */
    public static async choice (
        /**
         * Message to dislpay
         */
        message: string,
        /**
         * The choices available to the user
         */
        choices: Choices,
        /**
         * Item index front of which the cursor will initially appear
         */
        defaultIndex?: number,
    ) {
        return select({
            message,
            choices,
            default: defaultIndex ? choices.at(defaultIndex) : undefined
        })
    }


    /**
     * Ask the user for a simple "yes or no" confirmation. 
     * By default, this method returns `false`. However, if the user enters y or yes 
     * in response to the prompt, the method would return `true`.
     */
    public static async confirm (
        /**
         * Message to dislpay
         */
        message: string,
        /**
         * The default value
         */
        def?: boolean | undefined,
    ) {
        return confirm({
            message,
            default: def
        })
    }

    /**
     * Prompt the user with the given question, accept their input, 
     * and then return the user's input back to your command.
     */
    public static async ask (
        /**
         * Message to dislpay
         */
        message: string,
        /**
         * The default value
         */
        def?: string | undefined,
    ) {
        return input({
            message,
            default: def
        })
    }

    /**
     * Prompt the user with the given question, accept their input which 
     * will not be visible to them as they type in the console, 
     * and then return the user's input back to your command.
     */
    public static async secret (
        /**
         * Message to dislpay
         */
        message: string,
        /**
         * Mask the user input
         * 
         * @default true
         */
        mask?: string | boolean,
    ) {
        return password({
            message,
            mask
        })
    }

    /**
     * Provide auto-completion for possible choices. 
     * The user can still provide any answer, regardless of the auto-completion hints.
     */
    public static async anticipate (
        /**
         * Message to dislpay
         */
        message: string,
        /**
         * The source of completions
         */
        source: string[] | ((input?: string | undefined) => Promise<ChoiceOrSeparatorArray<any>>),
        /**
         * Set a default value
         */
        def?: string,
    ) {
        return autocomplete({
            message,
            source: Array.isArray(source) ? async (term) => {
                return (term ? source.filter(e => e.includes(term)) : source).map(e => ({ value: e }))
            } : source,
            suggestOnly: true,
            default: def
        })
    }
}
