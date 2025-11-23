import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'

import { Driver } from './Driver'
import { FlashBag } from '../FlashBag'
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
     * Read raw decrypted payload (including _flash).
     */
    private readRawPayload (): Record<string, any> {
        const file = this.sessionFilePath()
        if (!existsSync(file)) return {}
        const content = readFileSync(file, 'utf8')
        try {
            return this.encryptor.decrypt(content)
        } catch {
            return {}
        }
    }

    /**
     * Fetch decrypted payload and strip out flash metadata.
     */
    protected fetchPayload<T extends Record<string, any>> (): T {
        const payload = this.readRawPayload()
        // Merge flash data with payload
        return payload as T
    }

    /**
     * Write and encrypt session data to file.
     * Always persists flash state.
     *
     * @param data 
     */
    protected savePayload (payload: Record<string, any>): void {
        const file = this.sessionFilePath()

        // Remove flash data before saving
        // const { _flash, ...persistentPayload } = payload

        const encrypted = this.encryptor.encrypt(payload)
        writeFileSync(file, encrypted, 'utf8')
    }

    /**
     * Completely invalidate the current session and regenerate a new one.
     */
    invalidate (): void {
        const file = this.sessionFilePath()
        if (existsSync(file)) {
            rmSync(file, { recursive: true })
        }
        this.sessionId = crypto.randomUUID()
        this.flashBag = new FlashBag()
        this.savePayload({})
    }
}