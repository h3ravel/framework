import { JitiOptions, JitiResolveOptions, createJiti } from 'jiti'

import { FileImporter } from './types'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

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
    userOptions?: JitiOptions | undefined,
    resolveOptions?: (JitiResolveOptions & { default?: true })
): Promise<T> => {
    const resolvedPath = resolve(filePath)
    const jiti = createJiti(pathToFileURL(resolvedPath).href, {
        ...userOptions,
        interopDefault: false,
        tsconfigPaths: true,
    })

    return await jiti.import<T>(resolvedPath, resolveOptions)
}