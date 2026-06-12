import { createJiti, type JitiOptions, type JitiResolveOptions } from 'jiti'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import path, { resolve } from 'node:path'

export interface FileImporter {
    <T = unknown> (filePath: string): Promise<T>
    <T = unknown> (filePath: string, userOptions?: JitiOptions): Promise<T>
    <T = unknown> (
        filePath: string,
        userOptions?: JitiOptions,
        resolveOptions?: JitiResolveOptions & { default?: true },
    ): Promise<T>
}

const findProjectRoot = (filePath: string) => {
    let directory = path.dirname(filePath)

    while (directory !== path.dirname(directory)) {
        if (existsSync(path.join(directory, 'package.json'))) {
            return directory
        }

        directory = path.dirname(directory)
    }

    return process.cwd()
}

const conventionalAliases = (root: string) => ({
    src: path.join(root, 'src'),
    App: path.join(root, 'src/app'),
    root,
    routes: path.join(root, 'src/routes'),
    config: path.join(root, 'src/config'),
    resources: path.join(root, 'src/resources'),
})

const frameworkModules = [
    '@h3ravel/arquebus',
    '@h3ravel/cache',
    '@h3ravel/collect.js',
    '@h3ravel/config',
    '@h3ravel/console',
    '@h3ravel/contracts',
    '@h3ravel/core',
    '@h3ravel/database',
    '@h3ravel/events',
    '@h3ravel/filesystem',
    '@h3ravel/foundation',
    '@h3ravel/hashing',
    '@h3ravel/http',
    '@h3ravel/mail',
    '@h3ravel/musket',
    '@h3ravel/queue',
    '@h3ravel/router',
    '@h3ravel/session',
    '@h3ravel/shared',
    '@h3ravel/support',
    '@h3ravel/support/facades',
    '@h3ravel/support/traits',
    '@h3ravel/url',
    '@h3ravel/validation',
    '@h3ravel/view',
]

/**
 *
 * Dynamically imports a file at the given path with full TypeScript support,
 * including `tsconfig.json` path aliases.
 *
 * @param filePath - The path to the file to import.
 * @returns The imported module typed as `T`.
 *
 * @example
 * const config = await importFile<AppConfig>('./config/app.ts')
 */
export const importFile: FileImporter = async <T = unknown> (
    filePath: string,
    userOptions?: JitiOptions,
    resolveOptions?: JitiResolveOptions & { default?: true },
): Promise<T> => {
    const resolvedPath = resolve(filePath)
    const parentUrl = pathToFileURL(resolvedPath).href
    const extension = path.extname(resolvedPath).toLowerCase()

    if (['.js', '.mjs', '.cjs'].includes(extension)) {
        return await import(parentUrl) as T
    }

    let jiti

    try {
        jiti = createJiti(parentUrl, {
            ...userOptions,
            interopDefault: false,
            tryNative: userOptions?.tryNative ?? true,
            sourceMaps: userOptions?.sourceMaps ?? true,
            nativeModules: [
                ...frameworkModules,
                ...(userOptions?.nativeModules ?? []),
            ],
            tsconfigPaths: userOptions?.tsconfigPaths ?? true,
        })
    } catch {
        const projectRoot = findProjectRoot(resolvedPath)
        jiti = createJiti(parentUrl, {
            ...userOptions,
            alias: {
                ...conventionalAliases(projectRoot),
                ...userOptions?.alias,
            },
            interopDefault: false,
            tryNative: userOptions?.tryNative ?? true,
            sourceMaps: userOptions?.sourceMaps ?? true,
            nativeModules: [
                ...frameworkModules,
                ...(userOptions?.nativeModules ?? []),
            ],
            tsconfigPaths: false,
        })
    }

    return await jiti.import<T>(resolvedPath, resolveOptions)
}
