import { ChalkInstance } from "chalk";
import { Logger } from "../Utils/Logger";

export type LoggerChalk = keyof ChalkInstance | ChalkInstance | (keyof ChalkInstance)[]
export type LoggerParseSignature = [string, LoggerChalk][]

/**
 * Ouput formater object or format the output
 * 
 * @returns 
 */
export interface LoggerLog {
    (): typeof Logger
    <L extends boolean> (config: string, joiner: LoggerChalk, log?: L): L extends true ? void : string
    <L extends boolean> (config: LoggerParseSignature, joiner?: string, log?: L): L extends true ? void : string
    <L extends boolean> (config?: LoggerParseSignature, joiner?: string, log?: L): L extends true ? void : string | Logger
}
