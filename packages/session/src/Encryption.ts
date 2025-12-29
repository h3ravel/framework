import crypto, { createHash } from 'crypto'

import { ConfigException } from '@h3ravel/foundation'

export class Encryption {
    private key: Buffer

    constructor() {
        const appKey = process.env.APP_KEY
        if (!appKey) throw new ConfigException('APP_KEY not set in env')
        this.key = createHash('sha256').update(Buffer.from(appKey, 'base64')).digest()
    }

    /**
     * Encrypt session data using AES-256-CBC and the APP_KEY.
     */
    public encrypt (value: any) {
        value = typeof value === 'string' ? value : JSON.stringify(value)

        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv)
        const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
        return iv.toString('hex') + ':' + encrypted.toString('hex')
    }

    /**
     * Decrypt session data.
     */
    public decrypt (value: any) {
        const [ivHex, encryptedHex] = value.split(':')
        const iv = Buffer.from(ivHex, 'hex')
        const encrypted = Buffer.from(encryptedHex, 'hex')
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv)
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')

        try {
            return JSON.parse(decrypted)
        } catch {
            return decrypted
        }
    }
}
