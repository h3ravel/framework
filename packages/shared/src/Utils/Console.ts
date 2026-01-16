import { Logger } from './Logger'

export class Console {
    static log = (...args: any[]) => Logger.log(args.map(e => [e, 'white']))
    static debug = (...args: any[]) => Logger.debug(args, false, true)
    static warn = (...args: any[]) => args.map(e => Logger.warn(e, false, true))
    static info = (...args: any[]) => args.map(e => Logger.info(e, false, true))
    static error = (...args: any[]) => args.map(e => Logger.error(e, false), true)
}