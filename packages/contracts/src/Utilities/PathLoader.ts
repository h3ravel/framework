import { IPathName } from './Utilities'

export declare class PathLoader {
    /**
     * Dynamically retrieves a path property from the class.
     * Any property ending with "Path" is accessible automatically.
     *
     * @param name - The base name of the path property
     * @param prefix - The base path to prefix to the path
     * @returns 
     */
    getPath (name: IPathName, prefix?: string): string

    /**
     * Programatically set the paths.
     *
     * @param name - The base name of the path property
     * @param path - The new path
     * @param base - The base path to include to the path
     */
    setPath (name: IPathName, path: string, base?: string): void
}
