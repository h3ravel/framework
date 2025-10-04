import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from '../src/Commands/Command'
import { Logger } from '@h3ravel/shared'
import { Application } from '@h3ravel/core'
import { Kernel } from '../src/Kernel'

describe('Command Logging Methods', () => {
  let command: Command

  beforeEach(() => {
    const mockApp = {} as Application
    const mockKernel = {} as Kernel
    command = new Command(mockApp, mockKernel)
    
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
    command.info(message)
    expect(Logger.info).toHaveBeenCalledWith(message)
  })

  it('should call Logger.warn when warn method is called', () => {
    const message = 'Test warning message'
    command.warn(message)
    expect(Logger.warn).toHaveBeenCalledWith(message)
  })

  it('should call Logger.log when line method is called', () => {
    const message = 'Test line message'
    command.line(message)
    expect(Logger.log).toHaveBeenCalledWith(message)
  })

  it('should call console.log when newLine is called', () => {
    command.newLine()
    expect(console.log).toHaveBeenCalledTimes(1)
  })

  it('should call console.log multiple times with count', () => {
    command.newLine(3)
    expect(console.log).toHaveBeenCalledTimes(3)
  })

  it('should call Logger.success when success method is called', () => {
    const message = 'Test success message'
    command.success(message)
    expect(Logger.success).toHaveBeenCalledWith(message)
  })

  it('should call Logger.error when error method is called', () => {
    const message = 'Test error message'
    command.error(message)
    expect(Logger.error).toHaveBeenCalledWith(message)
  })

  it('should call Logger.debug when debug method is called', () => {
    const message = 'Test debug message'
    command.debug(message)
    expect(Logger.debug).toHaveBeenCalledWith(message)
  })
})
