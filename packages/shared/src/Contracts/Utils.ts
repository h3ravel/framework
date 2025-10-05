import { ChalkInstance } from 'chalk'
import { Logger } from '../Utils/Logger'

export type LoggerChalk = keyof ChalkInstance | ChalkInstance | (keyof ChalkInstance)[]
export type LoggerParseSignature = [string, LoggerChalk][]

/**
 * Ouput formater object or format the output
 * 
 * @param config 
 * @param joiner 
 * @param log If set to false, string output will be returned and not logged 
 * @param sc color to use ue on split text if : is found 
 * 
 * @returns 
 */
export interface LoggerLog {
    (): typeof Logger
    <L extends boolean> (
        config: string,
        joiner: LoggerChalk,
        log?: L,
        sc?: LoggerChalk
    ): L extends true ? void : string
    <L extends boolean> (
        config: LoggerParseSignature,
        joiner?: string,
        log?: L,
        sc?: LoggerChalk
    ): L extends true ? void : string
    <L extends boolean> (
        config?: LoggerParseSignature,
        joiner?: string,
        log?: L,
        sc?: LoggerChalk
    ): L extends true ? void : string | Logger
}
