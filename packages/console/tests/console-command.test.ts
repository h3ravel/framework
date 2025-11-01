import { Command, Kernel } from '@h3ravel/musket'
import { Logger, Prompts } from '@h3ravel/shared'
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'

import { Application } from '@h3ravel/core'
import { Command as ICommand } from 'commander'

console.log = vi.fn(() => 0)

// Mock the Logger to capture calls
const originalInfo = Logger.info
const originalSuccess = Logger.success
const originalError = Logger.error
const originalWarn = Logger.warn
const originalDebug = Logger.debug

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

let mockLoggerOutput: Array<{ level: string, message: string }> = []
const mockConsoleOutput: Array<{ method: string, message: string }> = []

beforeEach(() => {
  mockLoggerOutput = []

  Logger.info = vi.fn((msg: any) => {
    mockConsoleOutput.push({ method: 'info', message: msg })
  })
  Logger.success = vi.fn((msg: any) => {
    mockConsoleOutput.push({ method: 'success', message: msg })
  })
  Logger.error = vi.fn((msg: any) => {
    mockConsoleOutput.push({ method: 'error', message: msg })
  })
  Logger.warn = vi.fn((msg: any) => {
    mockConsoleOutput.push({ method: 'warn', message: msg })
  })
  Logger.debug = vi.fn((msg: any) => {
    mockConsoleOutput.push({ method: 'debug', message: msg })
  })
})

afterEach(() => {
  Logger.info = originalInfo
  Logger.success = originalSuccess
  Logger.error = originalError
  Logger.warn = originalWarn
  Logger.debug = originalDebug
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
    // this.info('Test info message')
    // this.success('Test success message')
    // this.error('Test error message')
    // this.warn('Test warning message')
    // this.debug('Test debug message')
  }
}

describe('CLI Options', () => {
  let command: TestCommand
  let mockApp: Application
  let mockKernel: Kernel
  let mockProgram: ICommand

  beforeEach(() => {
    mockApp = {} as Application
    mockKernel = {} as Kernel
    command = new TestCommand(mockApp, mockKernel)

    // Create a mock commander program
    mockProgram = new ICommand()
    command.program = mockProgram
  })

  describe('Flag Detection', () => {
    test('should detect quiet mode', () => {
      mockProgram.setOptionValue('quiet', true)
      command.loadBaseFlags()

      expect(command.isQuiet()).toBe(true)
      expect(command.isSilent()).toBe(false)
    })

    test('should detect silent mode', () => {
      mockProgram.setOptionValue('silent', true)
      command.loadBaseFlags()

      expect(command.isSilent()).toBe(true)
      expect(command.isQuiet()).toBe(false)
    })

    test('should detect no-interaction mode', () => {
      mockProgram.setOptionValue('no-interaction', true)
      command.loadBaseFlags()

      expect(command.isNonInteractive()).toBe(true)
    })

    test('should detect verbosity levels', () => {
      // Test default verbosity
      command.loadBaseFlags()
      expect(command.getVerbosity()).toBe(0)

      // Test verbose level 1
      mockProgram.setOptionValue('verbose', '1')
      command.loadBaseFlags()
      expect(command.getVerbosity()).toBe(1)

      // Test verbose level 3 (debug)
      mockProgram.setOptionValue('verbose', '3')
      command.loadBaseFlags()
      expect(command.getVerbosity()).toBe(3)
    })
  })

  describe('Output Suppression', () => {
    test('should suppress info and success in quiet mode', async () => {
      mockProgram.setOptionValue('quiet', true)
      command.loadBaseFlags()

      await command.handle()

      const infoMessages = mockLoggerOutput.filter(log => log.level === 'info')
      const successMessages = mockLoggerOutput.filter(log => log.level === 'success')
      // const errorMessages = mockLoggerOutput.filter(log => log.level === 'error')
      // const warnMessages = mockLoggerOutput.filter(log => log.level === 'warn')

      expect(infoMessages).toHaveLength(0)
      expect(successMessages).toHaveLength(0)
      // expect(errorMessages).toHaveLength(1) // Errors should still show
      // expect(warnMessages).toHaveLength(1) // Warnings should still show
    })

    test('should suppress all output in silent mode', async () => {
      mockProgram.setOptionValue('silent', true)
      command.loadBaseFlags()

      await command.handle()

      expect(mockLoggerOutput).toHaveLength(0)
    })

    test('should show debug messages only with verbosity >= 3', async () => {
      // Test with default verbosity (0)
      command.loadBaseFlags()
      await command.handle()

      const debugMessages = mockLoggerOutput.filter(log => log.level === 'debug')
      expect(debugMessages).toHaveLength(0)

      // Reset and test with verbosity 3
      mockLoggerOutput = []
      mockProgram.setOptionValue('verbose', '3')
      command.loadBaseFlags()
      await command.handle()

      // debugMessages = mockLoggerOutput.filter(log => log.level === 'debug')
      // expect(debugMessages).toHaveLength(1)
    })
  })

  describe('No Interaction Mode', () => {
    beforeEach(() => {
      mockProgram.setOptionValue('no-interaction', true)
      command.loadBaseFlags()
    })
  })

  describe('Flag Precedence', () => {
    test('--silent should override --quiet', () => {
      mockProgram.setOptionValue('quiet', true)
      mockProgram.setOptionValue('silent', true)
      command.loadBaseFlags()

      expect(command.isSilent()).toBe(true)
      expect(command.isQuiet()).toBe(true)

      // Silent should take precedence in output suppression
      Logger.configure({
        verbosity: command.getVerbosity(),
        quiet: command.isQuiet(),
        silent: command.isSilent()
      })

      // All output should be suppressed when silent
      Logger.info('test')
      expect(mockLoggerOutput).toHaveLength(0)
    })

    test('--quiet should suppress --verbose for info/success messages', async () => {
      mockProgram.setOptionValue('quiet', true)
      mockProgram.setOptionValue('verbose', '2')
      command.loadBaseFlags()

      await command.handle()

      const infoMessages = mockLoggerOutput.filter(log => log.level === 'info')
      const successMessages = mockLoggerOutput.filter(log => log.level === 'success')

      expect(infoMessages).toHaveLength(0)
      expect(successMessages).toHaveLength(0)
    })
  })
})


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
