import { Command, Kernel } from '@h3ravel/musket'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Application } from '@h3ravel/core'

console.log = vi.fn(() => 0)

vi.mock('@h3ravel/shared', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@h3ravel/shared')>()

    return {
        ...actual, // keep Logger, and any other real exports
        Prompts: {
            choice: vi.fn(),
            anticipate: vi.fn(),
            secret: vi.fn(),
            confirm: vi.fn(),
            ask: vi.fn()
        }
    }
})

// Test class extending base Command
class TestCommand extends Command {
    protected signature = 'test:command'

    ask = vi.fn()
    choice = vi.fn()
    confirm = vi.fn()
    secret = vi.fn()
    anticipate = vi.fn()

    async handle () {
    }
}

describe('CLI Prompts', () => {

    let command: TestCommand
    let mockApp: Application
    let mockKernel: Kernel

    beforeEach(() => {
        mockApp = {} as Application
        mockKernel = {} as Kernel
        command = new TestCommand(mockApp, mockKernel)
    })

    describe('Choice', () => {
        it('calls select with correct message and choices', async () => {
            const mock = command.choice as any
            mock.mockResolvedValue('Legacy')

            await command.choice('What is your name?', ['Legacy', 'Kaylah'])

            expect(mock).toHaveBeenCalledWith('What is your name?', ['Legacy', 'Kaylah'])
            expect(await mock.getMockImplementation()()).toBe('Legacy')
        })
    })

    describe('Confirm', () => {
        it('asks for confirmation', async () => {
            const mock = command.confirm as any
            mock.mockResolvedValue('y')

            await command.confirm('Are you ready?')

            expect(mock).toHaveBeenCalledWith('Are you ready?')
            expect(await mock.getMockImplementation()()).toBe('y')
        })
    })

    describe('Ask', () => {
        it('prompts for answer', async () => {
            const mock = command.ask as any
            mock.mockResolvedValue('Legacy')
            const result = await command.ask('What is your name?', 'Legacy')

            expect(mock).toHaveBeenCalledWith('What is your name?', 'Legacy')
            expect(result).toBe('Legacy')
        })

        it('prompts for answer but accepts default value', async () => {
            await command.ask('What is your name?', 'Legacy')

            expect(command.ask).toHaveBeenCalledWith('What is your name?', 'Legacy')
        })
    })

    describe('Secret', () => {
        it('calls password with default mask (undefined)', async () => {
            const mock = command.secret as any
            mock.mockResolvedValue('hidden')

            const result = await command.secret('Enter key')

            expect(mock).toHaveBeenCalledWith('Enter key')
            expect(result).toBe('hidden')
        })

        it('calls password with message and mask', async () => {
            const mock = command.secret as any
            mock.mockResolvedValue('my-secret')

            const result = await command.secret('Enter password', '*')

            expect(mock).toHaveBeenCalledWith('Enter password', '*')
            expect(result).toBe('my-secret')
        })
    })

    describe('Anticipate', () => {
        it('calls autocomplete with array source', async () => {
            const mock = command.anticipate as any
            mock.mockResolvedValue('apple')

            const source = ['apple', 'banana', 'cherry']

            const result = await command.anticipate('Pick fruit', source, 'banana')

            expect(mock).toHaveBeenCalledTimes(1)
            expect(mock.mock.calls[0][0]).toBe('Pick fruit')
            expect(mock.mock.calls[0][1]).toBe(source)
            expect(mock.mock.calls[0][2]).toBe('banana')
            expect(result).toBe('apple')
        })

        it('calls autocomplete with function source', async () => {
            const mock = command.anticipate as any
            mock.mockResolvedValue('option2')

            const fnSource = vi.fn(async (_term?: string) => [
                { value: 'option1' },
                { value: 'option2' }
            ])

            const result = await command.anticipate('Search', fnSource)

            expect(mock).toHaveBeenCalledWith('Search', fnSource)

            expect(result).toBe('option2')
        })
    })
})
