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
}
