import { IPathName } from '../Contracts/IApplication'
import nodepath from 'path'

export class PathLoader {
    private paths = {
        base: '',
        views: '/src/resources/views',
        assets: '/public/assets',
        routes: '/src/routes',
        config: '/src/config',
        public: '/public',
        storage: '/storage',
    }

    /**
     * Dynamically retrieves a path property from the class.
     * Any property ending with "Path" is accessible automatically.
     *
     * @param name - The base name of the path property
     * @param base - The base path to include to the path
     * @returns 
     */
    getPath (name: IPathName, base?: string): string {
        if (base && name !== 'base') {
            return nodepath.join(base, this.paths[name])
        }

        return this.paths[name]
    }

    /**
     * Programatically set the paths.
     *
     * @param name - The base name of the path property
     * @param path - The new path
     * @param base - The base path to include to the path
     */
    setPath (name: IPathName, path: string, base?: string) {
        if (base && name !== 'base') {
            this.paths[name] = nodepath.join(base, path)
        }

        this.paths[name] = path
    }
}
