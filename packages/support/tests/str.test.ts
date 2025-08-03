import { expect, test } from 'vitest'

import { pluralize } from '../src/Helpers/Str'

test('plural of user is users', () => {
    expect(pluralize('user', 2)).toBe('users')
})
