import * as Crypto from './Helpers/Crypto'
import * as DumpDie from './Helpers/DumpDie'
import * as Number from './Helpers/Number'
import * as Obj from './Helpers/Obj'

import { Arr } from './Helpers/Arr'
import { DateTime } from './Helpers/Time'
import { Str } from './Helpers/Str'

type CollapseStatics<T extends Record<string, any>> = {
    [K in keyof T]: T[K]
}


type Omitables =
    | 'start' | 'take' | 'reverse' | 'chunk' | 'find' | 'pop' | 'end' | 'shift' | 'push' | 'at' | 'prototype'
    | 'concat' | 'join' | 'slice' | 'sort' | 'splice' | 'includes' | 'indexOf' | 'lastIndexOf' | 'findIndex'
    | 'every' | 'some' | 'forEach' | 'map' | 'filter' | 'reduce' | 'unshift' | 'flat' | 'flatMap' | 'keys'
    | 'fill' | 'copyWithin' | 'entries' | 'values' | 'reduceRight' | 'length' | 'of' | '_isObject' | '_clone'
    | 'crossJoin' | 'divide' | 'wrap' | 'except' | 'hasAny' | 'isList' | 'keyBy' | 'mapWithKeys' | 'only' | 'pluck'
    | 'pull' | 'shuffle' | 'sortDesc' | 'sortRecursive' | 'sortRecursiveDesc' | 'where' | 'whereNotNull' | 'head'
    | typeof Symbol.unscopables | typeof Symbol.iterator

type TakeTime = Pick<typeof DateTime,
    | 'now' | 'format' | 'fromTimestamp' | 'randomTime' | 'firstDayOfMonth' | 'lastDayOfMonth' | 'parse'
>

type TakeString = Pick<typeof Str,
    | 'after' | 'afterLast' | 'apa' | 'ascii' | 'before' | 'beforeLast' | 'between' | 'betweenFirst' | 'capitalize'
    | 'plural' | 'singular' | 'title'
>

/**
 * Global helpers interface that mirrors Laravel's helpers
 * and provides convenient access to all utility functions
 */
export interface GlobalHelpers extends
    Omit<CollapseStatics<typeof Arr>, Omitables | 'random' | 'dot'>,
    Omit<CollapseStatics<TakeString>, Omitables | 'random' | 'uuid'>,
    Omit<CollapseStatics<TakeTime>, Omitables>,
    Omit<CollapseStatics<typeof Obj>, Omitables>,
    Omit<CollapseStatics<typeof Crypto>, Omitables>,
    Omit<CollapseStatics<typeof Number>, Omitables>,
    Omit<CollapseStatics<typeof DumpDie>, Omitables> {
    // Array helpers
    Arr: typeof Arr
    // String helpers
    Str: typeof Str
    // Object helpers
    Obj: typeof Obj
    // Crypto helpers
    Crypto: typeof Crypto
    // Number helpers
    Number: typeof Number
    // Debug helpers
    DumpDie: typeof DumpDie
    // Date Time helpers
    DateTime: typeof DateTime
}

/**
 * Bootstrap the global helpers into the global scope.
 * This enables optional global access to all helper functions.
 * 
 * Example usage:
 * ```typescript
 * import { loadHelpers } from '@h3ravel/support'
 * 
 * // Make helpers globally available
 * loadHelpers()
 * 
 * // Now you can use:
 * Arr.chunk([1, 2, 3, 4], 2)
 * // or directly:
 * chunk([1, 2, 3, 4], 2)
 * Str.capitalize('hello world')
 * // or directly:
 * capitalize('hello world')
 * ```
 * 
 * @param target - The target object to attach helpers to (default: globalThis)
 */
export function loadHelpers (target: any = globalThis): void {
    const globalHelpers: GlobalHelpers = {
        // Re-export helpers as modules
        Arr,
        Crypto,
        Number,
        Obj,
        Str,
        DateTime,
        DumpDie: DumpDie,

        // String helpers
        apa: Str.apa,
        title: Str.title,
        ascii: Str.ascii,
        after: Str.after,
        afterLast: Str.afterLast,
        before: Str.before,
        beforeLast: Str.beforeLast,
        between: Str.between,
        betweenFirst: Str.betweenFirst,
        plural: Str.plural,
        singular: Str.singular,
        capitalize: Str.capitalize,

        // Array helpers
        collapse: Arr.collapse,
        forget: Arr.forget,
        first: Arr.first,
        last: Arr.last,
        prepend: Arr.prepend,
        flatten: Arr.flatten,

        // Object helpers
        dot: Obj.dot,
        extractProperties: Obj.extractProperties,
        getValue: Obj.getValue,
        modObj: Obj.modObj,
        safeDot: Obj.safeDot as any,
        setNested: Obj.setNested,
        slugifyKeys: Obj.slugifyKeys,

        // Crypto helpers
        uuid: Crypto.uuid,
        random: Crypto.random,
        randomSecure: Crypto.randomSecure,
        hash: Crypto.hash,
        hmac: Crypto.hmac,
        base64Encode: Crypto.base64Encode,
        base64Decode: Crypto.base64Decode,
        xor: Crypto.xor,
        randomColor: Crypto.randomColor,
        randomPassword: Crypto.randomPassword,
        secureToken: Crypto.secureToken,
        checksum: Crypto.checksum,
        verifyChecksum: Crypto.verifyChecksum,
        caesarCipher: Crypto.caesarCipher,

        // Time helpers
        now: DateTime.now,
        format: DateTime.format,
        fromTimestamp: DateTime.fromTimestamp,
        parse: DateTime.parse,
        randomTime: DateTime.randomTime,
        firstDayOfMonth: DateTime.firstDayOfMonth,
        lastDayOfMonth: DateTime.lastDayOfMonth,

        // Number helpers
        abbreviate: Number.abbreviate,
        humanize: Number.humanize,
        toBytes: Number.toBytes,
        toHumanTime: Number.toHumanTime,

        // Debug helpers
        dump: DumpDie.dump,
        dd: DumpDie.dd,
    }

    // Attach helpers to target
    Object.assign(target, globalHelpers)
}

/**
 * Clean up global helpers by removing them from the global scope.
 * This function removes all global helper attachments.
 * 
 * @param target - The target object to clean up (default: globalThis)
 */
export function cleanHelpers (target: any = globalThis): void {
    const helpersToRemove = [
        // Array helpers
        'Arr', 'chunk', 'collapse', 'alternate', 'combine', 'each', 'keys', 'find',
        'forget', 'first', 'last', 'isEmpty', 'isNotEmpty', 'pop', 'prepend', 'take',
        'reverse', 'shift', 'range', 'where', 'skip', 'flatten',

        // String helpers
        'Str', 'after', 'afterLast', 'apa', 'ascii', 'before', 'beforeLast', 'between', 'betweenFirst', 'capitalize',
        'plural', 'singular', 'title',

        // Object helpers
        'Obj', 'dot', 'extractProperties', 'getValue', 'modObj', 'safeDot', 'setNested', 'slugifyKeys',

        // Crypto helpers
        'Crypto', 'uuid', 'random', 'randomSecure', 'hash', 'hmac', 'base64Encode',
        'base64Decode', 'xor', 'randomColor', 'randomPassword', 'secureToken',
        'checksum', 'verifyChecksum', 'caesarCipher',

        // Time helpers
        'Time', 'now', 'format', 'fromTimestamp', 'add', 'randomTime', 'firstDayOfMonth',
        'lastDayOfMonth', 'isLeapYear',

        // Number helpers
        'Number', 'abbreviate', 'humanize', 'toBytes', 'toHumanTime',

        // Debug helpers
        'dump', 'dd'
    ]

    helpersToRemove.forEach(helper => {
        if (helper in target) {
            delete target[helper]
        }
    })
}

// Also export as default bootstrap function for convenience
export default loadHelpers
