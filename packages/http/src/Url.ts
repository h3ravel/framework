export class Url {
    private baseUrl: string

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || process.env.APP_URL || 'http://localhost:3000'
    }

    /**
     * Generate a URL for the given path
     *
     * @param path - The path to append to the base URL
     * @returns The full URL
     */
    to(path?: string): string {
        if (!path) return this.baseUrl

        const cleanPath = path.startsWith('/') ? path : `/${path}`
        return `${this.baseUrl.replace(/\/$/, '')}${cleanPath}`
    }

    /**
     * Generate a secure URL (HTTPS) for the given path
     *
     * @param path - The path to append to the base URL
     * @returns The full HTTPS URL
     */
    secure(path?: string): string {
        const url = this.to(path)
        return url.replace(/^http:/, 'https:')
    }

    /**
     * Get the current base URL
     */
    current(): string {
        return this.baseUrl
    }

    /**
     * Set the base URL
     *
     * @param url - The new base URL
     */
    setBaseUrl(url: string): void {
        this.baseUrl = url
    }
}