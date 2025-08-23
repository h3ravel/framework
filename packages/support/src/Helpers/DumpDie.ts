import process from 'process'
import util from 'util'

const inspect = (thing: any) => {
    return util.inspect(thing, {
        showHidden: true,
        depth: null,
        colors: true
    })
}

export const dd = (...args: unknown[]): never => {
    args.forEach((thing) => {
        console.log(inspect(thing))
    })

    process.exit(1)
}

export const dump = (...args: unknown[]): void => {
    args.forEach((thing) => {
        console.log(inspect(thing))
    })
} 
