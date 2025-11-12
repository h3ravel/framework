import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'

import { Driver } from './Driver'
import { SessionDriver } from '../Contracts/SessionContract'
import path from 'path'

/**
 * FileDriver
 *
 * Stores session data as encrypted JSON files.
 * Each session is stored in its own file named after the session ID.
 * Ideal for local development or low-scale deployments.
 */
export class FileDriver extends Driver implements SessionDriver {
    constructor(
        protected sessionId: string,
        private sessionDir: string = path.resolve('.sessions'),
        private cwd: string = process.cwd()
    ) {
        super()
        this.sessionDir = path.join(this.cwd, sessionDir)
        this.sessionId = sessionId

        if (!existsSync(this.sessionDir)) {
            mkdirSync(this.sessionDir, { recursive: true })
        }

        this.ensureSessionFile()
    }

    /**
     * Ensures the session file exists and is initialized.
     */
    private ensureSessionFile (): void {
        const file = this.sessionFilePath()
        if (!existsSync(file)) {
            this.savePayload({})
        }
    }

    /**
     * Get the absolute path for the current session file.
     */
    private sessionFilePath (): string {
        return path.join(this.sessionDir, this.sessionId)
    }

    /**
     * Read and decrypt session data from file.
     */
    protected fetchPayload (): Record<string, any> {
        const file = this.sessionFilePath()
        if (!existsSync(file)) return {}
        const content = readFileSync(file, 'utf8')
        return this.encryptor.decrypt(content)
    }

    /**
     * Write and encrypt session data to file.
     */
    protected savePayload (data: Record<string, any>): void {
        const file = this.sessionFilePath()
        const encrypted = this.encryptor.encrypt(data)
        writeFileSync(file, encrypted, 'utf8')
    }

    /** 
     * Invalidate session completely and regenerate empty session. 
     */
    invalidate () {
        const file = this.sessionFilePath()
        rmSync(file, { recursive: true })
        this.sessionId = crypto.randomUUID()
        this.savePayload({})
    }
}
