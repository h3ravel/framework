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

        const resolved = this.resolveFileUp('package', ['json'], packageJson)

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
     * Recursively find files starting from given cwd
     * 
     * @param name 
     * @param extensions 
     * @param cwd 
     * 
     * @returns 
     */
    static resolveFileUp (
        name: string,
        extensions: string[] | ((dir: string, names: string[]) => string | false),
        cwd?: string
    ) {
        cwd ??= process.cwd()

        return escalade(cwd, (dir, names) => {
            if (typeof extensions === 'function') {
                return extensions(dir, names)
            }

            const candidates = new Set(extensions.map(ext => `${name}.${ext}`))
            for (const filename of names) {
                if (candidates.has(filename)) {
                    return filename
                }
            }

            return false
        })
    }
} 
