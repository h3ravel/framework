import { Injectable } from '@h3ravel/foundation'
import { Middleware } from '../Middleware'
import { Request } from '..'

export class TrustHosts extends Middleware {
    /**
     * The trusted hosts that have been configured to always be trusted.
     */
    protected static alwaysTrust?: string[] | ((...arg: any[]) => string[])

    /**
     * Indicates whether subdomains of the application URL should be trusted.
     */
    protected static subdomains?: boolean

    /**
     * Get the host patterns that should be trusted.
     */
    public hosts () {
        if (!TrustHosts.alwaysTrust) {
            return [this.allSubdomainsOfApplicationUrl()]
        }

        let hosts: (string | undefined)[]

        switch (true) {
            case Array.isArray(TrustHosts.alwaysTrust):
                hosts = TrustHosts.alwaysTrust
                break

            case typeof TrustHosts.alwaysTrust === 'function':
                hosts = TrustHosts.alwaysTrust()
                break

            default:
                hosts = []
                break
        }

        if (TrustHosts.subdomains) {
            hosts.push(this.allSubdomainsOfApplicationUrl())
        }

        return hosts
    }

    /**
     * Handle the incoming request.
     *
     * @param  request
     * @param  next
     */
    @Injectable()
    public async handle (request: Request, next: (request: Request) => Promise<unknown>): Promise<unknown> {
        if (this.shouldSpecifyTrustedHosts()) {
            Request.setTrustedHosts(this.hosts().filter(e => typeof e !== 'undefined'))
        }

        return next(request)
    }

    /**
     * Specify the hosts that should always be trusted.
     *
     * @param  hosts
     * @param  subdomains 
     */
    public static at (hosts: string[] | ((...arg: any[]) => string[]), subdomains = true): void {
        TrustHosts.alwaysTrust = hosts
        TrustHosts.subdomains = subdomains
    }

    /**
     * Determine if the application should specify trusted hosts.
     *
     * @return bool
     */
    protected shouldSpecifyTrustedHosts () {
        return !this.app.environment('local') &&
            !this.app.runningUnitTests()
    }

    /**
     * Get a regular expression matching the application URL and all of its subdomains.
     */
    protected allSubdomainsOfApplicationUrl (): string | undefined {
        const appUrl = this.app.make('config').get('app.url')
        const host = new URL(appUrl).host


        if (host) {
            const escapedHost = host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            return `^(.+\\.)?${escapedHost}$`
        }
    }

    /**
     * Flush the state of the middleware.
     *
     * @return void
     */
    public static flushState (): void {
        TrustHosts.alwaysTrust = undefined
        TrustHosts.subdomains = undefined
    }
}