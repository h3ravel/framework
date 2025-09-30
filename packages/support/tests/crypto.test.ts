import * as Crypto from '../src/Helpers/Crypto'

describe('Crypto helpers', () => {
  test('uuid format', () => {
    const id = Crypto.uuid()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  test('random vs randomSecure length', () => {
    expect(Crypto.random(10)).toHaveLength(10)
    expect(Crypto.randomSecure(10)).toHaveLength(10)
  })

  test('hash/hmac/base64/xor', () => {
    const h = Crypto.hash('hello')
    expect(h).toHaveLength(64)
    const hm = Crypto.hmac('data','key')
    expect(hm).toHaveLength(64)
    const b64 = Crypto.base64Encode('hi')
    expect(Crypto.base64Decode(b64)).toBe('hi')
    const text = 'secret'
    const key = 'k'
    const enc = Crypto.xor(text, key)
    expect(Crypto.xor(enc, key)).toBe(text)
  })

  test('colors/password/token/checksum', () => {
    expect(Crypto.randomColor()).toMatch(/^#[0-9a-f]{6}$/i)
    const pwd = Crypto.randomPassword(12)
    expect(pwd).toHaveLength(12)
    const token = Crypto.secureToken(16)
    expect(token).toHaveLength(32)
    const sum = Crypto.checksum('abc')
    expect(Crypto.verifyChecksum('abc', sum)).toBe(true)
    expect(Crypto.verifyChecksum('abd', sum)).toBe(false)
  })

  test('caesarCipher roundtrip', () => {
    const enc = Crypto.caesarCipher('Hello Zz', 3)
    expect(Crypto.caesarCipher(enc, -3)).toBe('Hello Zz')
  })
})
