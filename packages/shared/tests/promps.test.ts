import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { confirm, input, password, select } from '@inquirer/prompts'

import { Prompts } from '../src/Utils/Prompts'
import autocomplete from 'inquirer-autocomplete-standalone'

vi.mock('@inquirer/prompts', () => ({
    input: vi.fn(),
    select: vi.fn(),
    confirm: vi.fn(),
    password: vi.fn(),
    Separator: vi.fn()
}))

vi.mock('inquirer-autocomplete-standalone', () => ({
    default: vi.fn()
}))

afterEach(() => {
    vi.resetAllMocks()
})

beforeEach(() => {
    vi.clearAllMocks()
})

describe('Prompts.Choice', () => {

    it('calls select with correct message and choices', async () => {
        const fakeChoices = ['Option 1', 'Option 2'];
        (select as any).mockResolvedValue('Option 1')
        const result = await Prompts.choice('Pick one', fakeChoices)

        expect(select).toHaveBeenCalledWith({
            message: 'Pick one',
            choices: fakeChoices
        })
        expect(result).toBe('Option 1')
    })

    it('calls select with correct message and choices but accepts default value', async () => {
        const fakeChoices = ['Option 1', 'Option 2']
        await Prompts.choice('Pick one', fakeChoices, 1)

        expect(select).toHaveBeenCalledWith({
            message: 'Pick one',
            choices: fakeChoices,
            default: 'Option 2',
        })
    })
})

describe('Prompts.Confirm', () => {
    it('asks for confirmation', async () => {
        (confirm as any).mockResolvedValue('y')
        const result = await Prompts.confirm('Continue?')

        expect(confirm).toHaveBeenCalledWith({
            message: 'Continue?',
        })
        expect(result).toBe('y')
    })
})

describe('Prompts.Ask', () => {

    it('prompts for answer', async () => {
        (input as any).mockResolvedValue('Legacy')
        const result = await Prompts.ask('What is your name?')

        expect(input).toHaveBeenCalledWith({
            message: 'What is your name?',
        })
        expect(result).toBe('Legacy')
    })

    it('prompts for answer but accepts default value', async () => {
        await Prompts.ask('What is your name?', 'Legacy')

        expect(input).toHaveBeenCalledWith({
            message: 'What is your name?',
            default: 'Legacy',
        })
    })
})

describe('Prompts.Secret', () => {
    it('calls password with default mask (undefined)', async () => {
        const mockPassword = password as any
        mockPassword.mockResolvedValue('hidden')

        const result = await Prompts.secret('Enter key')

        expect(mockPassword).toHaveBeenCalledWith({
            message: 'Enter key',
            mask: undefined
        })
        expect(result).toBe('hidden')
    })

    it('calls password with message and mask', async () => {
        const mockPassword = password as any
        mockPassword.mockResolvedValue('my-secret')

        const result = await Prompts.secret('Enter password', '*')

        expect(mockPassword).toHaveBeenCalledWith({
            message: 'Enter password',
            mask: '*'
        })
        expect(result).toBe('my-secret')
    })
})

describe('Prompts.Anticipate', () => {
    it('calls autocomplete with array source', async () => {
        const mockAutocomplete = autocomplete as any
        mockAutocomplete.mockResolvedValue('apple')

        const source = ['apple', 'banana', 'cherry']

        const result = await Prompts.anticipate('Pick fruit', source, 'banana')

        expect(mockAutocomplete).toHaveBeenCalledTimes(1)
        const args = mockAutocomplete.mock.calls[0][0]

        expect(args.message).toBe('Pick fruit')
        expect(args.suggestOnly).toBe(true)
        expect(args.default).toBe('banana')

        expect(typeof args.source).toBe('function')

        const suggestions = await args.source('a')
        expect(suggestions).toEqual([
            { value: 'apple' },
            { value: 'banana' }
        ])

        expect(result).toBe('apple')
    })

    it('calls autocomplete with function source', async () => {
        const mockAutocomplete = autocomplete as unknown as any
        mockAutocomplete.mockResolvedValue('option2')

        const fnSource = vi.fn(async (_term?: string) => [
            { value: 'option1' },
            { value: 'option2' }
        ])

        const result = await Prompts.anticipate('Search', fnSource)

        expect(mockAutocomplete).toHaveBeenCalledWith({
            message: 'Search',
            source: fnSource,
            suggestOnly: true,
            default: undefined
        })
        expect(result).toBe('option2')
    })
})
