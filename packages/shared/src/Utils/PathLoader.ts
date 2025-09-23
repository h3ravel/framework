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
        database: '/src/database',
    }

    /**
     * Dynamically retrieves a path property from the class.
     * Any property ending with "Path" is accessible automatically.
     *
     * @param name - The base name of the path property
     * @param prefix - The base path to prefix to the path
     * @returns 
     */
    getPath (name: IPathName, prefix?: string): string {
        let path: string

        if (prefix && name !== 'base') {
            path = nodepath.join(prefix, this.paths[name])
        } else {
            path = this.paths[name]
        }

        path = path.replace('/src/', `/${process.env.SRC_PATH ?? 'src'}/`.replace(/([^:]\/)\/+/g, '$1'))

        if (name === 'database' && process.env.SRC_PATH && !'/src/'.includes(process.env.SRC_PATH)) {
            return nodepath.resolve(path.replace(process.env.SRC_PATH, ''))
        }

        return path
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
