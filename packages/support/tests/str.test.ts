import { describe, expect, test } from 'vitest'

import { Str } from '../src/Helpers/Str'

describe('Str helpers', () => {
  test('after/afterLast/before/beforeLast', () => {
    expect(Str.after('hello world', 'l')).toBe('lo world')
    expect(Str.after('hello', 'z')).toBe('hello')
    expect(Str.afterLast('a.b.c', '.')).toBe('c')
    expect(Str.before('hello world', ' ')).toBe('hello')
    expect(Str.beforeLast('a.b.c', '.')).toBe('a.b')
  })

  test('capitalize/singularize/pluralize/slugify/subString/substring variants', () => {
    expect(Str.capitalize('hello')).toBe('Hello')
    expect(Str.slugify('Hello World!', '_')).toBe('hello_world_')
    expect(Str.truncate('abcdef', 4)).toBe('abcd...')
    expect(Str.substr('abcdef', 2)).toBe('cdef')
    expect(Str.substr('abcdef', -2)).toBe('ef')
    expect(Str.sub('abcdef', 1, 3)).toBe('bc')
    expect(Str.singularize('books')).toBe('book')
    expect(Str.pluralize('book', 2)).toBe('books')
  })

  test('substitute/truncate/esc', () => {
    expect(Str.substitute('Hi { user.name }!', { user: { name: 'Jane' } })).toBe('Hi Jane!')
    expect(Str.substitute('Test {missing}', {}, 'N/A')).toBe('Test N/A')
    expect(Str.truncate('<p>Hello world</p>', 5)).toBe('Hello...')
    expect(Str.esc('a"b')).toBe('a\\"b')
  })

  test('pad/split/chop/number checks/rot', () => {
    expect(Str.padRight('1', 3, '0')).toBe('100')
    expect(Str.padLeft('1', 3, '0')).toBe('001')
    expect(Str.explode('a,b,c', ',')).toEqual(['a', 'b', 'c'])
    expect(Str.explode(',a,b,', ',')).toEqual(['', 'a', 'b', ''])
    expect(Str.chop('abc')).toBe('ab')
    expect(Str.isNumber('12.3')).toBe(true)
    expect(Str.isInteger('12.3')).toBe(false)
    const encoded = Str.rot('hello', 13)
    expect(Str.rot(encoded, 13)).toBe('hello')
  })

  test('replace/translate/strip slashes/first-last lines', () => {
    expect(Str.replacePunctuation('hello...', '!')).toBe('hello!')
    expect(Str.translate('hello world', { 'world': 'earth' })).toBe('hello earth')
    expect(Str.translate('foo bar baz', [['foo', 'f'], ['bar', 'b']])).toBe('f b baz')
    expect(Str.ss('a\\/b')).toBe('a/b')
    const text = 'l1\nl2\nl3\nl4'
    expect(Str.firstLines(text, 2)).toBe('l1\nl2')
    expect(Str.lastLines(text, 2)).toBe('l3\nl4')
  })
})
