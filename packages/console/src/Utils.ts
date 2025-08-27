import { access } from 'fs/promises'
import chalk from 'chalk'
import escalade from 'escalade/sync'
import path from 'path'

const join = path.join

export class Utils {
  /**
   * Wraps text with chalk
   * 
   * @param txt 
   * @param color 
   * @returns 
   */
  static textFormat (txt: any, color: (txt: string) => string) {
    return String(txt).split(':').map((e, i, a) => i == 0 && a.length > 1 ? color(' ' + e + ': ') : e).join('')
  }

  /**
   * Ouput formater object
   * 
   * @returns 
   */
  static output () {
    return {
      success: (msg: any, exit = false) => {
        console.log(chalk.green('✓'), this.textFormat(msg, chalk.bgGreen), '\n')
        if (exit) process.exit(0)
      },
      info: (msg: any, exit = false) => {
        console.log(chalk.blue('ℹ'), this.textFormat(msg, chalk.bgBlue), '\n')
        if (exit) process.exit(0)
      },
      error: (msg: string | string[] | Error & { detail?: string }, exit = true) => {
        if (msg instanceof Error) {
          if (msg.message) {
            console.error(chalk.red('✖'), this.textFormat('ERROR:' + msg.message, chalk.bgRed))
          }
          console.error(chalk.red(`${msg.detail ? `${msg.detail}\n` : ''}${msg.stack}`), '\n')
        }
        else {
          console.error(chalk.red('✖'), this.textFormat(msg, chalk.bgRed), '\n')
        }
        if (exit) process.exit(1)
      },
      split: (name: string, value: string, status?: 'success' | 'info' | 'error', exit = false) => {
        status ??= 'info'
        const color = { success: chalk.bgGreen, info: chalk.bgBlue, error: chalk.bgRed }
        const regex = /\x1b\[\d+m/g
        const width = Math.min(process.stdout.columns, 100)
        const dots = Math.max(width - name.replace(regex, '').length - value.replace(regex, '').length - 10, 0)

        console.log(this.textFormat(name, color[status]), chalk.gray('.'.repeat(dots)), value)
        if (exit) process.exit(0)
      },
      quiet: () => {
        process.exit(0)
      }
    }
  }

  static findModulePkg (moduleId: string, cwd?: string) {
    const parts = moduleId.replace(/\\/g, '/').split('/')

    let packageName = ''
    // Handle scoped package name
    if (parts.length > 0 && parts[0][0] === '@') {
      packageName += parts.shift() + '/'
    }
    packageName += parts.shift()

    const packageJson = path.join(cwd ?? process.cwd(), 'node_modules', packageName)

    const resolved = this.findUpConfig(packageJson, 'package', ['json'])

    if (!resolved) {
      return
    }

    return path.join(path.dirname(resolved), parts.join('/'))
  }

  static async getMigrationPaths (cwd: string, migrator: any, defaultPath: string, path: string) {
    if (path) {
      return [join(cwd, path)]
    }
    return [
      ...migrator.getPaths(),
      join(cwd, defaultPath),
    ]
  }

  static twoColumnDetail (name: string, value: string) {
    // eslint-disable-next-line no-control-regex
    const regex = /\x1b\[\d+m/g
    const width = Math.min(process.stdout.columns, 100)
    const dots = Math.max(width - name.replace(regex, '').length - value.replace(regex, '').length - 10, 0)
    return console.log(name, chalk.gray('.'.repeat(dots)), value)
  }

  /**
   * Check if file exists
   * 
   * @param path 
   * @returns 
   */
  static async fileExists (path: string): Promise<boolean> {
    try {
      await access(path)
      return true
    } catch {
      return false
    }
  }

  static findUpConfig (cwd: string, name: string, extensions: string[]) {
    return escalade(cwd, (_dir, names) => {
      for (const ext of extensions) {
        const filename = `${name}.${ext}`
        if (names.includes(filename)) {
          return filename
        }
      }
      return false
    })
  }
}

class TableGuesser {
  static CREATE_PATTERNS = [
    /^create_(\w+)_table$/,
    /^create_(\w+)$/
  ]
  static CHANGE_PATTERNS = [
    /.+_(to|from|in)_(\w+)_table$/,
    /.+_(to|from|in)_(\w+)$/
  ]
  static guess (migration: string) {
    for (const pattern of TableGuesser.CREATE_PATTERNS) {
      const matches = migration.match(pattern)
      if (matches) {
        return [matches[1], true]
      }
    }
    for (const pattern of TableGuesser.CHANGE_PATTERNS) {
      const matches = migration.match(pattern)
      if (matches) {
        return [matches[2], false]
      }
    }
    return []
  }
}

export { TableGuesser }
