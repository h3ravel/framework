import { Command } from "../Commands/Command";

export type CommandOption = {
    name: string;
    required?: boolean;
    multiple?: boolean;
    defaultValue?: string | number | boolean | undefined | string[]
    shared?: boolean;
    description?: string;
    /**
     * for options like --Q|queue
     */
    flags?: string[];
    /**
     * true if it's a flag option
     */
    isFlag?: boolean;
    /**
     * true if name begins with '#' or '^'
     */
    isHidden?: boolean;
    /**
     * for nested options
     */
    nestedOptions?: CommandOption[];
};

export type ParsedCommand = {
    commandClass: Command;

    baseCommand: string;

    description?: string;
    /**
     * true if baseCommand begins with '#' or '^'
     */
    isHidden?: boolean;
    /**
     * true if baseCommand ends with ':'
     */
    isNamespaceCommand: boolean;
    /**
     * for colon-ended commands
     */
    subCommands?: CommandOption[];
    /**
     * for normal commands
     */
    options?: CommandOption[];
};
