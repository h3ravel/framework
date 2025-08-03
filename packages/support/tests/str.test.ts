import { pluralize } from '../src/Helpers/Str'

describe('Support Package\'s Str', () => {
  test('plural of user is users', () => {
    expect(pluralize('user', 2)).toBe('users')
  })
})
