import process from 'process'
import util from 'util'

const inspect = (thing: any) => {
    return util.inspect(thing, {
        showHidden: true,
        depth: null,
        colors: true
    })
}

/**
 * Dump something and kill the process for quick debugging. Based on Laravel's dd()
 * 
 * @param args 
 */
export const dd = (...args: unknown[]): never => {
    args.forEach((thing) => {
        console.log(inspect(thing))
    })

    process.exit(1)
}

/**
 * Dump something but keep the process for quick debugging. Based on Laravel's dump()
 * 
 * @param args 
 */
export const dump = (...args: unknown[]): void => {
    args.forEach((thing) => {
        console.log(inspect(thing))
    })
} 
