import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

import { Encryption } from '../Encryption'
import { SessionDriver } from '../Contracts/SessionContract'
import path from 'path'

/**
 * FileDriver
 *
 * Stores session data as encrypted JSON files.
 * Each session is stored in its own file named after the session ID.
 * Ideal for local development or low-scale deployments.
 */
export class FileDriver implements SessionDriver {
    private sessionDir: string
    private sessionId: string
    private encryptor = new Encryption()

    constructor(
        sessionId: string,
        sessionDir: string = path.resolve('.sessions'),
        private cwd: string = process.cwd()
    ) {
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
            this.writeEncrypted({})
        }
    }

    /**
     * Get the absolute path for the current session file.
     */
    private sessionFilePath (): string {
        return path.join(this.sessionDir, `${this.sessionId}.json`)
    }

    /**
     * Read and decrypt session data from file.
     */
    private readDecrypted (): Record<string, any> {
        const file = this.sessionFilePath()
        if (!existsSync(file)) return {}
        const content = readFileSync(file, 'utf8')
        return this.encryptor.decrypt(content)
    }

    /**
     * Write and encrypt session data to file.
     */
    private writeEncrypted (data: Record<string, any>): void {
        const file = this.sessionFilePath()
        const encrypted = this.encryptor.encrypt(data)
        writeFileSync(file, encrypted, 'utf8')
    }

    /**
     * Retrieve a value from the session.
     */
    get (key: string): any {
        const data = this.readDecrypted()
        return data[key]
    }

    /**
     * Store a value in the session.
     */
    set (key: string, value: any): void {
        const data = this.readDecrypted()
        data[key] = value
        this.writeEncrypted(data)
    }

    /**
     * Store multiple key/value pairs.
     */
    put (values: Record<string, any>): void {
        const data = this.readDecrypted()
        Object.assign(data, values)
        this.writeEncrypted(data)
    }

    /**
     * Append a value to an array key in the session.
     */
    push (key: string, value: any): void {
        const data = this.readDecrypted()
        if (!Array.isArray(data[key])) data[key] = []
        data[key].push(value)
        this.writeEncrypted(data)
    }

    /**
     * Remove a key from the session.
     */
    forget (key: string): void {
        const data = this.readDecrypted()
        delete data[key]
        this.writeEncrypted(data)
    }

    /**
     * Retrieve all session data.
     */
    all (): Record<string, any> {
        return this.readDecrypted()
    }

    /**
     * Flush (clear) the session.
     */
    flush (): void {
        this.writeEncrypted({})
    }
}
