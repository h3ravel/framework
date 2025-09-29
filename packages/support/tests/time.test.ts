import * as Time from '../src/Helpers/Time'

describe('Time helpers', () => {
  test('now/unix monotonicity', () => {
    const a = Time.now()
    const b = Time.now()
    expect(b).toBeGreaterThanOrEqual(a)
    expect(Time.unix()).toBeGreaterThan(0)
  })

  test('format and fromTimestamp', () => {
    const date = new Date('2023-12-25T15:30:45Z')
    expect(Time.format(date, 'Y-m-d')).toBe('2023-12-25')
    expect(Time.format(date, 'Y-m-d H:i:s')).toBe('2023-12-25 15:30:45')
    const d = Time.fromTimestamp(1700000000)
    expect(d instanceof Date).toBe(true)
  })

  test('diff/add/subtract', () => {
    const ref = new Date('2023-01-01T00:00:00Z')
    const prev = new Date('2022-12-31T23:59:00Z')
    expect(Time.diff(prev, ref)).toBe(60)
    expect(Time.add(ref, 1, 'days').getUTCDate()).toBe(2)
    expect(Time.subtract(ref, 1, 'days').getUTCDate()).toBe(31)
  })

  test('start/end', () => {
    const d = new Date('2023-12-25T15:30:45')
    const s = Time.start(d, 'days')
    expect(s.getHours()).toBe(0)
    const e = Time.end(d, 'days')
    expect(e.getHours()).toBe(23)
  })

  test('isBetween/day utilities', () => {
    const origH = Date.prototype.getHours
    const origM = Date.prototype.getMinutes
    Date.prototype.getHours = function () { return 14 }
    Date.prototype.getMinutes = function () { return 30 }
    expect(Time.isBetween('14:00','15:00')).toBe(true)
    expect(Time.isBetween('15:00','16:00')).toBe(false)
    Date.prototype.getHours = origH
    Date.prototype.getMinutes = origM
    expect(Time.dayOfYear(new Date('2023-01-01'))).toBe(1)
    const f = Time.firstDayOfMonth(new Date('2023-12-15'))
    expect(f.getDate()).toBe(1)
    expect(Time.isLeapYear(2020)).toBe(true)
  })
})
