import { describe, expect, test } from 'vitest'

import { Time } from '../src/Helpers/Time'

describe('Time helpers', () => {
  test('now/unix monotonicity', () => {
    const a = Time.now().unix()
    const b = Time.now().unix()
    expect(b).toBeGreaterThanOrEqual(a)
    expect(Time.now().unix()).toBeGreaterThan(0)
  })

  test('format and fromTimestamp', () => {
    const date = new Date('2023-12-25T15:30:45')
    expect(Time.parse(date).carbonFormat('Y-m-d')).toBe('2023-12-25')
    expect(Time.parse(date).carbonFormat('Y-m-d H:i:s')).toBe('2023-12-25 15:30:45')
    const d = Time.fromTimestamp(1700000000)
    expect(d instanceof Date).toBe(true)
  })

  test('diff/add/subtract', () => {
    const ref = new Date('2023-01-01T00:00:00Z')
    const prev = new Date('2022-12-31T23:59:00Z')
    expect(Time.parse(ref).diff(prev, 'seconds')).toBe(60)
    expect(Time.parse(ref).add(1, 'days').date()).toBe(2)
    expect(Time.parse(ref).subtract(1, 'days').date()).toBe(31)
  })

  test('start/end', () => {
    const d = new Date('2023-12-25T15:30:45')
    const s = Time.parse(d).start('days')
    expect(s.hour()).toBe(0)
    const e = Time.parse(d).end('days')
    expect(e.hour()).toBe(23)
  })

  test('isBetween/day utilities', () => {
    const origH = Date.prototype.getHours
    const origM = Date.prototype.getMinutes
    Date.prototype.getHours = function () { return 14 }
    Date.prototype.getMinutes = function () { return 30 }
    expect(Time.parse('2010-10-20').isBetween('2010-10-19', '2010-10-25')).toBe(true)
    expect(Time.parse('2010-10-27').isBetween('2010-10-25', '2010-10-29')).toBe(true)
    Date.prototype.getHours = origH
    Date.prototype.getMinutes = origM
    expect(Time.parse(new Date('2023-01-01')).dayOfYear()).toBe(1)
    const f = Time.parse(new Date('2023-12-15')).firstDayOfMonth()
    expect(f.date()).toBe(1)
    expect(Time.parse('2020').isLeapYear()).toBe(true)
  })
})
