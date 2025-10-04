import { Command } from '@h3ravel/console'

export default class ExampleCommand extends Command {
  signature = 'example:run'
  description = 'An example command demonstrating logging methods'

  async handle() {
    this.info('Starting example command...')
    this.newLine()
    
    this.line('This is a plain line')
    this.warn('This is a warning message')
    this.debug('Debug information here')
    
    this.newLine(2)
    this.success('Example command completed successfully!')
  }
}
