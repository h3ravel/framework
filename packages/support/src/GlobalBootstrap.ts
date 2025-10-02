import * as Arr from './Helpers/Arr'
import * as Crypto from './Helpers/Crypto'
import * as DumpDie from './Helpers/DumpDie'
import * as Number from './Helpers/Number'
import * as Obj from './Helpers/Obj'
import * as Str from './Helpers/Str'
import * as Time from './Helpers/Time'

/**
 * Global helpers interface that mirrors Laravel's helpers
 * and provides convenient access to all utility functions
 */
export interface GlobalHelpers {
    // Array helpers
    Arr: typeof Arr
    chunk: typeof Arr.chunk
    collapse: typeof Arr.collapse
    alternate: typeof Arr.alternate
    combine: typeof Arr.combine
    find: typeof Arr.find
    forget: typeof Arr.forget
    first: typeof Arr.first
    last: typeof Arr.last
    isEmpty: typeof Arr.isEmpty
    isNotEmpty: typeof Arr.isNotEmpty
    pop: typeof Arr.pop
    prepend: typeof Arr.prepend
    take: typeof Arr.take
    reverse: typeof Arr.reverse
    shift: typeof Arr.shift
    range: typeof Arr.range
    flatten: typeof Arr.flatten

    // String helpers
    Str: typeof Str
    after: typeof Str.after
    afterLast: typeof Str.afterLast
    before: typeof Str.before
    beforeLast: typeof Str.beforeLast
    capitalize: typeof Str.capitalize
    pluralize: typeof Str.pluralize
    singularize: typeof Str.singularize
    slugify: typeof Str.slugify
    subString: typeof Str.subString
    substitute: typeof Str.substitute
    truncate: typeof Str.truncate
    substr: typeof Str.substr
    sub: typeof Str.sub
    esc: typeof Str.esc
    padString: typeof Str.padString
    split: typeof Str.split
    chop: typeof Str.chop
    isNumber: typeof Str.isNumber
    isInteger: typeof Str.isInteger
    rot: typeof Str.rot
    replacePunctuation: typeof Str.replacePunctuation
    translate: typeof Str.translate
    ss: typeof Str.ss
    firstLines: typeof Str.firstLines
    lastLines: typeof Str.lastLines

    // Object helpers
    Obj: typeof Obj
    dot: typeof Obj.dot
    extractProperties: typeof Obj.extractProperties
    getValue: typeof Obj.getValue
    modObj: typeof Obj.modObj
    safeDot: typeof Obj.safeDot
    setNested: typeof Obj.setNested
    slugifyKeys: typeof Obj.slugifyKeys

    // Crypto helpers
    Crypto: typeof Crypto
    uuid: typeof Crypto.uuid
    random: typeof Crypto.random
    randomSecure: typeof Crypto.randomSecure
    hash: typeof Crypto.hash
    hmac: typeof Crypto.hmac
    base64Encode: typeof Crypto.base64Encode
    base64Decode: typeof Crypto.base64Decode
    xor: typeof Crypto.xor
    randomColor: typeof Crypto.randomColor
    randomPassword: typeof Crypto.randomPassword
    secureToken: typeof Crypto.secureToken
    checksum: typeof Crypto.checksum
    verifyChecksum: typeof Crypto.verifyChecksum
    caesarCipher: typeof Crypto.caesarCipher

    // Time helpers
    Time: typeof Time
    now: typeof Time.now
    unix: typeof Time.unix
    format: typeof Time.format
    fromTimestamp: typeof Time.fromTimestamp
    diff: typeof Time.diff
    subtract: typeof Time.subtract
    add: typeof Time.add
    start: typeof Time.start
    end: typeof Time.end
    fromNow: typeof Time.fromNow
    randomTime: typeof Time.randomTime
    isBetween: typeof Time.isBetween
    dayOfYear: typeof Time.dayOfYear
    firstDayOfMonth: typeof Time.firstDayOfMonth
    lastDayOfMonth: typeof Time.lastDayOfMonth
    isLeapYear: typeof Time.isLeapYear

    // Number helpers
    Number: typeof Number
    abbreviate: typeof Number.abbreviate
    humanize: typeof Number.humanize
    toBytes: typeof Number.toBytes
    toHumanTime: typeof Number.toHumanTime

    // Debug helpers
    dump: typeof DumpDie.dump
    dd: typeof DumpDie.dd
}

/**
 * Bootstrap the global helpers into the global scope.
 * This enables optional global access to all helper functions.
 * 
 * Example usage:
 * ```typescript
 * import { bootstrap } from '@h3ravel/support'
 * 
 * // Make helpers globally available
 * bootstrap()
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
export function bootstrap (target: any = globalThis): void {
    const globalHelpers: GlobalHelpers = {
        // Re-export helpers as modules
        Arr,
        Crypto,
        Number,
        Obj,
        Str,
        Time,

        // Array helpers
        chunk: Arr.chunk,
        collapse: Arr.collapse,
        alternate: Arr.alternate,
        combine: Arr.combine,
        find: Arr.find,
        forget: Arr.forget,
        first: Arr.first,
        last: Arr.last,
        isEmpty: Arr.isEmpty,
        isNotEmpty: Arr.isNotEmpty,
        pop: Arr.pop,
        prepend: Arr.prepend,
        take: Arr.take,
        reverse: Arr.reverse,
        shift: Arr.shift,
        range: Arr.range,
        flatten: Arr.flatten,

        // String helpers
        after: Str.after,
        afterLast: Str.afterLast,
        before: Str.before,
        beforeLast: Str.beforeLast,
        capitalize: Str.capitalize,
        pluralize: Str.pluralize,
        singularize: Str.singularize,
        slugify: Str.slugify,
        subString: Str.subString,
        substitute: Str.substitute,
        truncate: Str.truncate,
        substr: Str.substr,
        sub: Str.sub,
        esc: Str.esc,
        padString: Str.padString,
        split: Str.split,
        chop: Str.chop,
        isNumber: Str.isNumber,
        isInteger: Str.isInteger,
        rot: Str.rot,
        replacePunctuation: Str.replacePunctuation,
        translate: Str.translate,
        ss: Str.ss,
        firstLines: Str.firstLines,
        lastLines: Str.lastLines,

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
        now: Time.now,
        unix: Time.unix,
        format: Time.format,
        fromTimestamp: Time.fromTimestamp,
        diff: Time.diff,
        subtract: Time.subtract,
        add: Time.add,
        start: Time.start,
        end: Time.end,
        fromNow: Time.fromNow,
        randomTime: Time.randomTime,
        isBetween: Time.isBetween,
        dayOfYear: Time.dayOfYear,
        firstDayOfMonth: Time.firstDayOfMonth,
        lastDayOfMonth: Time.lastDayOfMonth,
        isLeapYear: Time.isLeapYear,

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
export function cleanBootstrap (target: any = globalThis): void {
    const helpersToRemove = [
        // Array helpers
        'Arr', 'chunk', 'collapse', 'alternate', 'combine', 'each', 'keys', 'find',
        'forget', 'first', 'last', 'isEmpty', 'isNotEmpty', 'pop', 'prepend', 'take',
        'reverse', 'shift', 'range', 'where', 'skip', 'flatten',

        // String helpers
        'Str', 'after', 'afterLast', 'before', 'beforeLast', 'capitalize', 'pluralize',
        'singularize', 'slugify', 'subString', 'substitute', 'truncate', 'startsWith',
        'endsWith', 'substr', 'sub', 'esc', 'padString', 'trim', 'ltrim', 'rtrim',
        'trimChars', 'split', 'chop', 'isNumber', 'isInteger', 'rot', 'replacePunctuation',
        'translate', 'ss', 'firstLines', 'lastLines',

        // Object helpers
        'Obj', 'dot', 'extractProperties', 'getValue', 'modObj', 'safeDot', 'setNested', 'slugifyKeys',

        // Crypto helpers
        'Crypto', 'uuid', 'random', 'randomSecure', 'hash', 'hmac', 'base64Encode',
        'base64Decode', 'xor', 'randomColor', 'randomPassword', 'secureToken',
        'checksum', 'verifyChecksum', 'caesarCipher',

        // Time helpers
        'Time', 'now', 'unix', 'format', 'fromTimestamp', 'diff', 'subtract', 'add',
        'start', 'end', 'fromNow', 'randomTime', 'isBetween', 'dayOfYear',
        'firstDayOfMonth', 'lastDayOfMonth', 'isLeapYear',

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
export default bootstrap
