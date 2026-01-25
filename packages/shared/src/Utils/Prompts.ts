import { Choices, Spinner } from '../Contracts/PromptsContract'
import autocomplete, { ChoiceOrSeparatorArray } from 'inquirer-autocomplete-standalone'
import { checkbox, confirm, editor, input, password, select } from '@inquirer/prompts'
import ora, { Options as oraOptions } from 'ora'

import { Logger } from '..'

export class Prompts extends Logger {
    /**
     * Allows users to pick from a predefined set of choices when asked a question.
     * 
     * @param message      Message to display
     * @param choices      The choices available to the user
     * @param defaultIndex Item index front of which the cursor will initially appear
     * @param pageSize     The number of items to show per page
     * @returns
     */
    public static async choice (
        message: string,
        choices: Choices,
        defaultIndex?: number,
        pageSize?: number,
    ) {
        return select({
            message,
            choices,
            default: defaultIndex ? choices.at(defaultIndex) : undefined,
            pageSize
        })
    }


    /**
     * Ask the user for a simple "yes or no" confirmation. 
     * By default, this method returns `false`. However, if the user enters y or yes 
     * in response to the prompt, the method would return `true`.
     * 
     * @param message      Message to display
     * @param defaultValue The default value
     */
    public static async confirm (
        message: string,
        defaultValue?: boolean | undefined,
    ) {
        return confirm({
            message,
            default: defaultValue
        })
    }

    /**
     * Prompt the user with the given question, accept their input, 
     * and then return the user's input back to your command.
     * 
     * @param message      Message to display
     * @param defaultValue The default value
     * @returns 
     */
    public static async ask (
        message: string,
        defaultValue?: string | undefined,
    ) {
        return input({
            message,
            default: defaultValue
        })
    }

    /**
     * Prompt the user with the given question, accept their input which 
     * will not be visible to them as they type in the console, 
     * and then return the user's input back to your command.
     * 
     * @param message Message to display
     * @param mask    Mask the user input
     * @returns 
     */
    public static async secret (
        message: string,
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
    /**
     * 
     * @param message      Message to dislpay
     * @param source       The source of completions
     * @param defaultValue Set a default value
     * @param pageSize     The number of items to show per page
     * @returns 
     */
    public static async anticipate (
        message: string,
        source: string[] | ((input?: string | undefined) => Promise<ChoiceOrSeparatorArray<any>>),
        defaultValue?: string,
        pageSize?: number,
    ) {
        return autocomplete({
            message,
            source: Array.isArray(source) ? async (term) => {
                return (term ? source.filter(e => e.includes(term)) : source).map(e => ({ value: e }))
            } : source,
            suggestOnly: true,
            default: defaultValue,
            pageSize
        })
    }

    /**
     * Display a spinner while performing a long task
     * 
     * @param options The spinner options
     * @returns 
     */
    public static spinner (options?: string | oraOptions | undefined): Spinner {
        return ora(options)
    }

    /**
     * Allows users to select multiple options from a predefined list of choices.
     * 
     * @param message  Message to display
     * @param choices  The choices available to the user
     * @param required Whether at least one choice is required
     * @param prefix   Prefix to display before the message
     * @param pageSize The number of items to show per page
     * @returns
     */
    public static async checkbox (
        message: string,
        choices: Choices,
        required?: boolean,
        prefix?: string,
        pageSize?: number,
    ) {
        return await checkbox({
            message,
            choices,
            required,
            prefix,
            pageSize
        })
    }

    /**
     * Open the user's default text editor to accept multi-line input.
     * 
     * @param message  Message to display
     * @param postfix  The postfix of the file being edited [e.g., '.txt', '.md']
     * @param defaultValue The default value to pre-fill in the editor
     * @param validate A function to validate the input text
     * @returns
     */
    public static async editor (
        message?: string,
        postfix?: string,
        defaultValue?: string,
        validate?: (text: string) => boolean | string
    ) {
        return await editor({
            message: message ?? 'Please provide your input in the editor below:',
            postfix,
            default: defaultValue,
            validate
        })
    }
}
