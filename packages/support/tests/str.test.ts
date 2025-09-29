import { after, afterLast, before, beforeLast, capitalize, pluralize, singularize, slugify, subString, substitute, truncate, substr, sub, esc, padString, split, chop, isNumber, isInteger, rot, replacePunctuation, translate, ss, firstLines, lastLines } from '../src/Helpers/Str'

describe('Str helpers', () => {
  test('after/afterLast/before/beforeLast', () => {
    expect(after('hello world', 'l')).toBe('lo world')
    expect(after('hello', 'z')).toBe('hello')
    expect(afterLast('a.b.c', '.')).toBe('c')
    expect(before('hello world', ' ')).toBe('hello')
    expect(beforeLast('a.b.c', '.')).toBe('a.b')
  })

  test('capitalize/slugify/subString/substring variants', () => {
    expect(capitalize('hello')).toBe('Hello')
    expect(slugify('Hello World!')).toBe('hello_world_')
    expect(subString('abcdef', 4)).toBe('a...')
    expect(substr('abcdef', 2)).toBe('cdef')
    expect(substr('abcdef', -2)).toBe('ef')
    expect(sub('abcdef', 1, 3)).toBe('bc')
  })

  test('substitute/truncate/esc', () => {
    expect(substitute('Hi { user.name }!', { user: { name: 'Jane' } })).toBe('Hi Jane!')
    expect(substitute('Test {missing}', {}, 'N/A')).toBe('Test N/A')
    expect(truncate('<p>Hello world</p>', 5)).toBe('He...')
    expect(esc('a"b')).toBe('a\\"b')
  })

  test('pad/split/chop/number checks/rot', () => {
    expect(padString('1', 3, '0')).toBe('100')
    expect(padString('1', 3, '0', false)).toBe('001')
    expect(split('a,b,c', ',')).toEqual(['a','b','c'])
    expect(split(',a,b,', ',')).toEqual([''])
    expect(chop('abc')).toBe('ab')
    expect(isNumber('12.3')).toBe(true)
    expect(isInteger('12.3')).toBe(false)
    const encoded = rot('hello', 13)
    expect(rot(encoded, 13)).toBe('hello')
  })

  test('replace/translate/strip slashes/first-last lines', () => {
    expect(replacePunctuation('hello...', '!')).toBe('hello!')
    expect(translate('hello world', { 'world': 'earth' })).toBe('hello earth')
    expect(translate('foo bar baz', [['foo','f'], ['bar','b']])).toBe('f b baz')
    expect(ss('a\\/b')).toBe('a/b')
    const text = 'l1\nl2\nl3\nl4'
    expect(firstLines(text, 2)).toBe('l1\nl2')
    expect(lastLines(text, 2)).toBe('l3\nl4')
  })
})
