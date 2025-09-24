import { access } from 'fs/promises'
import escalade from 'escalade/sync'
import path from 'path'

export class FileSystem {
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

    /**
     * Recursively find files
     * 
     * @param cwd 
     * @param name 
     * @param extensions 
     * @returns 
     */
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
