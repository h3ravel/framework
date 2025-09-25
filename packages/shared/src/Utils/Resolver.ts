import crypto from 'crypto'
import preferredPM from 'preferred-pm'

export class Resolver {
    static async getPakageInstallCommand (pkg: string) {
        const pm = (await preferredPM(process.cwd()))?.name ?? 'pnpm'

        let cmd = 'install'
        if (pm === 'yarn' || pm === 'pnpm')
            cmd = 'add'
        else if (pm === 'bun')
            cmd = 'create'

        return `${pm} ${cmd} ${pkg}`
    }

    /**
     * Create a hash for a function or an object
     * 
     * @param provider 
     * @returns 
     */
    static hashObjectOrFunction (provider: object | ((..._: any[]) => any)): string {
        return crypto
            .createHash('sha1')
            .update(provider.toString())
            .digest('hex')
    }
}
