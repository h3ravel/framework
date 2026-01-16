import { HashAlgorithm, HashInfo } from '@h3ravel/contracts'

export class ParseInfo {

    public static getInfo (hashed: string, algo: HashAlgorithm = 'bcrypt') {
        if (algo === 'bcrypt') {
            return this.bcrypt(hashed)
        }

        return this.argon2(hashed)
    }

    public static argon2 (hashed: string) {
        const info: HashInfo['options'] = {}
        // Example: $argon2id$v=19$m=65536,t=4,p=1$...
        const parts = hashed.split('$')
        const params = parts[3] // "m=65536,t=4,p=1"
        const versionPart = parts[2] // e.g. v=19

        if (versionPart && versionPart.startsWith('v=')) {
            const version = parseInt(versionPart.split('=')[1], 10)
            if (!isNaN(version)) info.algo = version
        }

        if (!params) return info

        for (const part of params.split(',')) {
            const [key, value] = part.split('=')
            info[key === 'm' ? 'memoryCost' : key === 't' ? 'timeCost' : key === 'p' ? 'threads' : key] = parseInt(value, 10)
        }

        return info
    }

    public static bcrypt (hashed: string): HashInfo['options'] {
        const match = hashed.match(/^\$2[aby]?\$(\d+)\$/)
        return {
            cost: match ? parseInt(match[1], 10) : undefined,
        }
    }
}
