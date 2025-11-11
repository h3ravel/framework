import { access } from 'fs/promises'
import escalade from 'escalade/sync'
import { existsSync } from 'fs'
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
        extensions: string[] | ((dir: string, filesNames: string[]) => string | false),
        cwd?: string
    ) {
        cwd ??= process.cwd()

        return escalade(cwd, (dir, filesNames) => {
            if (typeof extensions === 'function') {
                return extensions(dir, filesNames)
            }

            const candidates = new Set(extensions.map(ext => `${name}.${ext}`))
            for (const filename of filesNames) {
                if (candidates.has(filename)) {
                    return filename
                }
            }

            return false
        }) ?? undefined
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
    static resolveModulePath (
        moduleId: string,
        pathName: string | string[],
        cwd?: string
    ) {
        pathName = Array.isArray(pathName) ? pathName : [pathName]
        const module = this.findModulePkg(moduleId, cwd) ?? ''

        for (const name of pathName) {
            const file = path.join(module, name)
            if (existsSync(file)) {
                return file
            }
        }

        return
    }
} 
