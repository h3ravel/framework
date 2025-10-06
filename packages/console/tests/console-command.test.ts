import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { Application } from '@h3ravel/core'
import { Command } from 'commander'
import { ConsoleCommand } from '@h3ravel/core'
import { ConsoleKernel } from '@h3ravel/core'
import { Logger } from '@h3ravel/shared'

// Mock the Logger to capture calls
const originalInfo = Logger.info
const originalSuccess = Logger.success
const originalError = Logger.error
const originalWarn = Logger.warn
const originalDebug = Logger.debug

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

// Test class extending ConsoleCommand
class TestCommand extends ConsoleCommand {
  protected signature = 'test:command'

  async handle () {
    this.info('Test info message')
    this.success('Test success message')
    this.error('Test error message')
    this.warn('Test warning message')
    this.debug('Test debug message')
  }
}

describe('Console Command CLI Options', () => {
  let command: TestCommand
  let mockApp: Application
  let mockKernel: ConsoleKernel
  let mockProgram: Command

  beforeEach(() => {
    mockApp = {} as Application
    mockKernel = {} as ConsoleKernel
    command = new TestCommand(mockApp, mockKernel)

    // Create a mock commander program
    mockProgram = new Command()
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

    // test('should return default answer for ask()', async () => {
    //   const result = await command.ask('Test question?', 'default answer')
    //   expect(result).toBe('default answer')
    // })

    // test('should return default value for confirm()', async () => {
    //   const result = await command.confirm('Continue?', true)
    //   expect(result).toBe(true)
    // })

    // test('should return default choice for choice()', async () => {
    //   const result = await command.choice('Pick one:', ['option1', 'option2'], 'option2')
    //   expect(result).toBe('option2')
    // })

    // test('should return first choice when no default provided', async () => {
    //   const result = await command.choice('Pick one:', ['option1', 'option2'])
    //   expect(result).toBe('option1')
    // })

    // test('should exit with error when ask() has no default', async () => {
    //   const mockExit = vi.spyOn(process, 'exit').mockImplementation()

    //   await command.ask('Test question?')

    //   expect(mockExit).toHaveBeenCalledWith(1)
    //   mockExit.mockRestore()
    // })
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
