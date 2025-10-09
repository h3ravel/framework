import { CommandOption, ParsedCommand } from './Contracts/ICommand'

import { Command } from './Commands/Command'

export class Signature {
    /**
     * Helper to parse options inside a block of text
     * 
     * @param block 
     * @returns 
     */
    static parseOptions (block: string): CommandOption[] {
        const options: CommandOption[] = []
        /**
         * Match { ... } blocks at top level 
         */
        const regex = /\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}/g
        let match: RegExpExecArray | null

        while ((match = regex.exec(block)) !== null) {
            const shared = '^' === match[1][0]! || /:[#^]/.test(match[1])
            const isHidden = (['#', '^'].includes(match[1][0]!) || /:[#^]/.test(match[1])) && !shared
            const content = match[1].trim().replace(/[#^]/, '')
            /**
             * Split by first ':' to separate name and description+nested
             */
            const colonIndex = content.indexOf(':')
            if (colonIndex === -1) {
                /**
                 * No description, treat whole as name
                 */
                options.push({ name: content })
                continue
            }

            const namePart = content.substring(0, colonIndex).trim()
            const rest = content.substring(colonIndex + 1).trim()

            /**
             * Check for nested options after '|'
             */
            let description: string = rest
            let nestedOptions: CommandOption[] | undefined

            const pipeIndex = rest.indexOf('|')
            if (pipeIndex !== -1) {
                description = rest.substring(0, pipeIndex).trim()
                const nestedText = rest.substring(pipeIndex + 1).trim()
                /**
                 * nestedText should start with '{' and end with ')', clean it
                 * Also Remove trailing ')' if present
                 */
                const cleanedNestedText = nestedText.replace(/^\{/, '').trim()

                /**
                 * Parse nested options recursively
                 */
                nestedOptions = Signature.parseOptions('{' + cleanedNestedText + '}')
            } else {
                /**
                 * Trim the string
                 */
                description = description.trim()
            }

            // Initialize all variables
            let name = namePart
            let flags: string[] | undefined
            let choices: string[] = []
            let required = /[^a-zA-Z0-9_|-]/.test(name)
            let multiple = false
            let placeholder: string | undefined
            let defaultValue: string | number | boolean | undefined | string[]

            /**
             * Parse the command name
             */
            if (name.includes('=')) {
                const [rawName, rawDefault] = name.split('=')

                name = rawName.trim()
                const hold = rawName.trim().split('|')
                const holder = (hold.at(1) ?? hold.at(0)!).replace('--', '')
                defaultValue = rawDefault.trim()
                placeholder = defaultValue ? `[${holder}]` : `<${holder}>`
                required = false
            }

            /**
             * Parse name modifiers (?, *, ?*)
             */
            if (name.endsWith('?*')) {
                required = false
                multiple = true
                name = name.slice(0, -2)
            } else if (name.endsWith('*')) {
                multiple = true
                name = name.slice(0, -1)
            } else if (name.endsWith('?')) {
                required = false
                name = name.slice(0, -1)
                const cname = name.split('--').at(1)?.split('|').at(1) ?? name
                placeholder = `[${cname}]`
            }

            /**
             * Check if it's a flag option (starts with --)
             */
            const isFlag = name.startsWith('--')

            if (isFlag) {
                /**
                 * Parse flags and default values
                 */
                const flagParts = name.split('|').map(s => s.trim())

                flags = []

                for (let part of flagParts) {
                    if (part.startsWith('--') && part.slice(2).length === 1) {
                        part = '-' + part.slice(2)
                    } else if (part.startsWith('-') && !part.startsWith('--') && part.slice(1).length > 1) {
                        part = '--' + part.slice(1)
                    } else if (!part.startsWith('-') && part.slice(1).length > 1) {
                        part = '--' + part
                    }

                    const eqIndex = part.indexOf('=')
                    if (eqIndex !== -1) {
                        flags.push(part.substring(0, eqIndex))
                        const val = part.substring(eqIndex + 1)
                        if (val === '*') {
                            defaultValue = []
                        } else if (val === 'true' || val === 'false' || (!val && !required)) {
                            defaultValue = val === 'true'
                        } else if (!isNaN(Number(val))) {
                            defaultValue = Number(val)
                        } else {
                            defaultValue = val
                        }
                    } else {
                        flags.push(part)
                    }
                }
            }

            // Extract choices from the descriptions
            const desc = description.match(/^([^:]+?)\s*:\s*\[?([\w\s,]+)\]?$/)
            if (match) {
                description = desc?.[1].trim() ?? description
                choices = desc?.[2].split(',').map(s => s.trim()).filter(Boolean) ?? choices
            }

            options.push({
                name: isFlag ? flags![flags!.length - 1] : name,
                choices,
                required,
                multiple,
                description,
                flags,
                shared,
                isFlag,
                isHidden,
                placeholder,
                defaultValue,
                nestedOptions,
            })
        }

        return options
    }

    /**
     * Helper to parse a command's signature
     * 
     * @param signature 
     * @param commandClass 
     * @returns 
     */
    static parseSignature (signature: string, commandClass: Command): ParsedCommand {
        const lines = signature.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        const isHidden = ['#', '^'].includes(lines[0][0]!) || /:[#^]/.test(lines[0])
        const baseCommand = lines[0].split('{')[0].trim().replace(/[^\w:-]/g, '')
        const description = commandClass.getDescription()
        const isNamespaceCommand = baseCommand.endsWith(':')
        /**
         * Join the rest lines to a single string for parsing
         */
        const rest = lines.slice(1).join(' ')

        /**
         * Parse all top-level options/subcommands
         */
        const allOptions = Signature.parseOptions(rest)

        if (isNamespaceCommand) {
            /**
              * Separate subcommands (those without flags) and base options (flags)
              * Here we assume subcommands are those without flags (isFlag false)
              * and base options are flags or options after subcommands

              * For simplicity, treat all top-level options as subcommands
              * and assume base command options come after subcommands in signature (not shown in example)
              */

            return {
                baseCommand: baseCommand.slice(0, -1),
                isNamespaceCommand,
                subCommands: allOptions.filter(e => !e.flags && !e.isHidden),
                description,
                commandClass,
                options: allOptions.filter(e => !!e.flags),
                isHidden,
            }
        } else {
            return {
                baseCommand,
                isNamespaceCommand,
                options: allOptions,
                description,
                commandClass,
                isHidden,
            }
        }
    }
}
