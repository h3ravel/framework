import { access } from 'fs/promises'
import escalade from 'escalade/sync'
import path from 'path'
import preferredPM from 'preferred-pm'

const join = path.join

export class Utils {
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

  static async installCommand (pkg: string) {
    const pm = (await preferredPM(process.cwd()))?.name ?? 'pnpm'

    let cmd = 'install'
    if (pm === 'yarn' || pm === 'pnpm')
      cmd = 'add'
    else if (pm === 'bun')
      cmd = 'create'

    return `${pm} ${cmd} ${pkg}`
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
