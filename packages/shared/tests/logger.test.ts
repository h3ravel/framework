import { Logger } from '../src/Utils/Logger'
import { beforeEach, afterEach, describe, test, expect, vi } from 'vitest'

// Mock console methods
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

let mockConsoleOutput: Array<{ method: string, args: any[] }> = []

beforeEach(() => {
  mockConsoleOutput = []
   
  vi.spyOn(console, 'log').mockImplementation((...args) => {
    mockConsoleOutput.push({ method: 'log', args })
  }) 
  vi.spyOn(console, 'log').mockImplementation((...args) => {
    mockConsoleOutput.push({ method: 'error', args })
  }) 
  vi.spyOn(console, 'log').mockImplementation((...args) => {
    mockConsoleOutput.push({ method: 'warn', args })
  })
  
  // Reset Logger configuration
  Logger.configure({ verbosity: 0, quiet: false, silent: false })
})

afterEach(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

describe('Logger Verbosity Controls', () => {
  describe('Default Behavior', () => {
    test('should output all message types by default', () => {
      Logger.info('info message')
      Logger.success('success message')
      Logger.error('error message', false)
      Logger.warn('warning message')
      Logger.debug('debug message')
      
      expect(mockConsoleOutput).toHaveLength(4) // debug shouldn't show at verbosity 0
      
      const methods = mockConsoleOutput.map(output => output.method)
      expect(methods).toContain('log') // info, success, warn, debug use console.log
      expect(methods).toContain('error')
    })
  })

  describe('Silent Mode', () => {
    beforeEach(() => {
      Logger.configure({ silent: true })
    })

    test('should suppress all output', () => {
      Logger.info('info message')
      Logger.success('success message')
      Logger.error('error message', false)
      Logger.warn('warning message')
      Logger.debug('debug message')
      
      expect(mockConsoleOutput).toHaveLength(0)
    })
  })

  describe('Quiet Mode', () => {
    beforeEach(() => {
      Logger.configure({ quiet: true })
    })

    test('should suppress info and success messages', () => {
      Logger.info('info message')
      Logger.success('success message')
      Logger.error('error message', false)
      Logger.warn('warning message')
      Logger.debug('debug message')
      
      // Should only show error and warn (debug is suppressed by default verbosity)
      expect(mockConsoleOutput).toHaveLength(2)
      
      const outputContents = mockConsoleOutput.map(output => output.args.join(' '))
      expect(outputContents.some(content => content.includes('error message'))).toBe(true)
      expect(outputContents.some(content => content.includes('warning message'))).toBe(true)
      expect(outputContents.some(content => content.includes('info message'))).toBe(false)
      expect(outputContents.some(content => content.includes('success message'))).toBe(false)
    })
  })

  describe('Debug Verbosity', () => {
    test('should show debug messages only at verbosity >= 3', () => {
      // Test verbosity 0 (default)
      Logger.debug('debug message')
      expect(mockConsoleOutput).toHaveLength(0)
      
      // Test verbosity 1
      mockConsoleOutput = []
      Logger.configure({ verbosity: 1 })
      Logger.debug('debug message')
      expect(mockConsoleOutput).toHaveLength(0)
      
      // Test verbosity 2
      mockConsoleOutput = []
      Logger.configure({ verbosity: 2 })
      Logger.debug('debug message')
      expect(mockConsoleOutput).toHaveLength(0)
      
      // Test verbosity 3 (should show debug)
      mockConsoleOutput = []
      Logger.configure({ verbosity: 3 })
      Logger.debug('debug message')
      expect(mockConsoleOutput).toHaveLength(1)
      
      const outputContent = mockConsoleOutput[0].args.join(' ')
      expect(outputContent).toContain('debug message')
    })
  })

  describe('Flag Precedence', () => {
    test('silent should override quiet', () => {
      Logger.configure({ quiet: true, silent: true })
      
      Logger.info('info message')
      Logger.error('error message', false)
      Logger.warn('warning message')
      
      expect(mockConsoleOutput).toHaveLength(0)
    })

    test('quiet should override verbose for info/success', () => {
      Logger.configure({ quiet: true, verbosity: 3 })
      
      Logger.info('info message')
      Logger.success('success message')
      Logger.debug('debug message')
      Logger.warn('warning message')
      
      // Should show debug and warn, but not info/success due to quiet
      expect(mockConsoleOutput).toHaveLength(2)
      
      const outputContents = mockConsoleOutput.map(output => output.args.join(' '))
      expect(outputContents.some(content => content.includes('debug message'))).toBe(true)
      expect(outputContents.some(content => content.includes('warning message'))).toBe(true)
      expect(outputContents.some(content => content.includes('info message'))).toBe(false)
      expect(outputContents.some(content => content.includes('success message'))).toBe(false)
    })
  })

  describe('Configuration', () => {
    test('should accept partial configuration options', () => {
      // Test configuring only verbosity
      Logger.configure({ verbosity: 2 })
      Logger.debug('debug message')
      expect(mockConsoleOutput).toHaveLength(0) // Still below threshold
      
      // Test configuring only quiet
      mockConsoleOutput = []
      Logger.configure({ quiet: true })
      Logger.info('info message')
      Logger.warn('warning message')
      expect(mockConsoleOutput).toHaveLength(1) // Only warning should show
      
      // Test configuring only silent
      mockConsoleOutput = []
      Logger.configure({ silent: true })
      Logger.warn('warning message')
      expect(mockConsoleOutput).toHaveLength(0) // Nothing should show
    })

    test('should handle empty configuration', () => {
      Logger.configure({})
      
      Logger.info('info message')
      Logger.debug('debug message')
      
      expect(mockConsoleOutput).toHaveLength(1) // Only info should show (debug suppressed at default verbosity)
    })
  })
})
