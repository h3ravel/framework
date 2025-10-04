import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Musket } from '../src/Musket'
import { Logger } from '@h3ravel/shared'
import { Application } from '@h3ravel/core'
import { Kernel } from '../src/Kernel'

describe('Musket Logging Methods', () => {
  let musket: Musket
  let mockApp: Application
  let mockKernel: Kernel

  beforeEach(() => {
    // Create mock instances
    mockApp = {} as Application
    mockKernel = {
      app: mockApp,
      consolePackage: { version: '1.0.0' },
      modulePackage: { version: '1.0.0' }
    } as any

    musket = new Musket(mockApp, mockKernel)

    // Spy on Logger methods
    vi.spyOn(Logger, 'info').mockImplementation(() => {})
    vi.spyOn(Logger, 'warn').mockImplementation(() => {})
    vi.spyOn(Logger, 'log').mockImplementation(() => {})
    vi.spyOn(Logger, 'success').mockImplementation(() => {})
    vi.spyOn(Logger, 'error').mockImplementation(() => {})
    vi.spyOn(Logger, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call Logger.info when info method is called', () => {
    const message = 'Test info message'
    musket.info(message)
    expect(Logger.info).toHaveBeenCalledWith(message)
    expect(Logger.info).toHaveBeenCalledTimes(1)
  })

  it('should call Logger.warn when warn method is called', () => {
    const message = 'Test warning message'
    musket.warn(message)
    expect(Logger.warn).toHaveBeenCalledWith(message)
    expect(Logger.warn).toHaveBeenCalledTimes(1)
  })

  it('should call Logger.log when line method is called', () => {
    const message = 'Test line message'
    musket.line(message)
    expect(Logger.log).toHaveBeenCalledWith(message)
    expect(Logger.log).toHaveBeenCalledTimes(1)
  })

  it('should call console.log once when newLine method is called without arguments', () => {
    musket.newLine()
    expect(console.log).toHaveBeenCalledWith('')
    expect(console.log).toHaveBeenCalledTimes(1)
  })

  it('should call console.log multiple times when newLine is called with count', () => {
    musket.newLine(3)
    expect(console.log).toHaveBeenCalledWith('')
    expect(console.log).toHaveBeenCalledTimes(3)
  })

  it('should call Logger.success when success method is called', () => {
    const message = 'Test success message'
    musket.success(message)
    expect(Logger.success).toHaveBeenCalledWith(message)
    expect(Logger.success).toHaveBeenCalledTimes(1)
  })

  it('should call Logger.error when error method is called', () => {
    const message = 'Test error message'
    musket.error(message)
    expect(Logger.error).toHaveBeenCalledWith(message)
    expect(Logger.error).toHaveBeenCalledTimes(1)
  })

  it('should call Logger.debug when debug method is called', () => {
    const message = 'Test debug message'
    musket.debug(message)
    expect(Logger.debug).toHaveBeenCalledWith(message)
    expect(Logger.debug).toHaveBeenCalledTimes(1)
  })

  it('should handle empty string messages', () => {
    musket.info('')
    expect(Logger.info).toHaveBeenCalledWith('')
  })

  it('should handle newLine with count of 0', () => {
    musket.newLine(0)
    expect(console.log).not.toHaveBeenCalled()
  })
})
