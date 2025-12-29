import { Command } from '@h3ravel/musket'
import { Injectable } from '@h3ravel/core'
import { User } from 'src/app/Models/user'

export class ExampleCommand extends Command {

  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  protected signature: string = `example
        {name : Name of the example.}
        {--d|debug : Show debug info}
    `

  /**
   * The console command description.
   *
   * @var string
   */
  protected description: string = 'An example command'

  @Injectable()
  public async handle (user: User) {
    const name = this.argument('name')
    const debug = this.option('debug')
    const interactive = !this.isNonInteractive()

    this.info('Starting example command...')
    this.newLine()

    this.line('This is a plain line')
    this.warn('This is a warning message')
    this.debug('Debug information here')

    this.newLine(2)
    this.success('Example command completed successfully!')

    this.debug(['name: ' + name, 'debug: ' + (debug !== 'undefined'), 'interactive: ' + interactive])

    dump('user', user)
  }
}
