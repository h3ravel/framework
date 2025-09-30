import { randomUUID, randomBytes, createHash, createHmac } from 'crypto'

/**
 * Generate a random UUID string.
 * 
 * @returns A random UUID string
 */
export const uuid = (): string => {
    return randomUUID()
}

/**
 * Generate a random string of specified length.
 * 
 * @param length - Length of the random string (default: 16)
 * @param charset - Character set to use (default: alphanumeric)
 * @returns A random string
 */
export const random = (length: number = 16, charset: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'): string => {
    let result = ''
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return result
}

/**
 * Secure random string generator that uses crypto.randomBytes.
 * 
 * @param length - Length of the random string (default: 32)
 * @returns A cryptographically secure random string
 */
export const randomSecure = (length: number = 32): string => {
    return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length)
}

/**
 * Hash a string using the specified algorithm.
 * 
 * @param data - Data to hash
 * @param algorithm - Hash algorithm (default: 'sha256')
 * @returns Hexadecimal hash string
 */
export const hash = (data: string, algorithm: string = 'sha256'): string => {
    return createHash(algorithm).update(data).digest('hex')
}

/**
 * Hash a string with salt using HMAC.
 * 
 * @param data - Data to hash
 * @param key - Secret key for HMAC
 * @param algorithm - Hash algorithm (default: 'sha256')
 * @returns Hexadecimal hash string
 */
export const hmac = (data: string, key: string, algorithm: string = 'sha256'): string => {
    return createHmac(algorithm, key).update(data).digest('hex')
}

/**
 * Encode data to base64.
 * 
 * @param data - Data to encode
 * @returns Base64 encoded string
 */
export const base64Encode = (data: string): string => {
    return Buffer.from(data, 'utf8').toString('base64')
}

/**
 * Decode base64 data.
 * 
 * @param data - Base64 string to decode
 * @returns Decoded string
 */
export const base64Decode = (data: string): string => {
    return Buffer.from(data, 'base64').toString('utf8')
}

/**
 * Simple XOR encryption/decryption.
 * 
 * @param data - Data to encrypt/decrypt
 * @param key - Encryption key
 * @returns Encrypted/decrypted string
 */
export const xor = (data: string, key: string): string => {
    let result = ''
    const keyLength = key.length
    
    for (let i = 0; i < data.length; i++) {
        const dataCharCode = data.charCodeAt(i)
        const keyCharCode = key.charCodeAt(i % keyLength)
        result += String.fromCharCode(dataCharCode ^ keyCharCode)
    }
    
    return result
}

/**
 * Generate a random hex color code.
 * 
 * @returns A hex color code string (e.g., '#a3b2f3')
 */
export const randomColor = (): string => {
    const hex = random(6, '0123456789abcdef').toLowerCase()
    return `#${hex}`
}

/**
 * Generate a secure password using configurable parameters.
 * 
 * @param length - Password length (default: 16)
 * @param options - Character options
 * @returns A secure password string
 */
export interface PasswordOptions {
    useUppercase?: boolean
    useLowercase?: boolean
    useNumbers?: boolean
    useSymbols?: boolean
}

export const randomPassword = (length: number = 16, options: PasswordOptions = {}): string => {
    const defaults: Required<PasswordOptions> = {
        useUppercase: true,
        useLowercase: true,
        useNumbers: true,
        useSymbols: true
    }
    
    const opts = { ...defaults, ...options }
    let charset = ''
    
    if (opts.useUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (opts.useLowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (opts.useNumbers) charset += '0123456789'
    if (opts.useSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    if (charset.length === 0) {
        throw new Error('At least one character type must be enabled')
    }
    
    return random(length, charset)
}

/**
 * Generate a cryptographically secure token for APIs, sessions, etc.
 * 
 * @param strength - Token strength (bytes) (default: 32)
 * @returns A secure token string
 */
export const secureToken = (strength: number = 32): string => {
    return randomBytes(strength).toString('hex')
}

/**
 * Create a checksum for data integrity verification.
 * 
 * @param data - Data to create checksum for
 * @param algorithm - Hash algorithm (default: 'sha256')
 * @returns SHA256 checksum
 */
export const checksum = (data: string, algorithm: string = 'sha256'): string => {
    return hash(data, algorithm)
}

/**
 * Verify data integrity using checksum.
 * 
 * @param data - Data to verify
 * @param expectedChecksum - Expected checksum
 * @param algorithm - Hash algorithm (default: 'sha256')
 * @returns True if checksums match
 */
export const verifyChecksum = (data: string, expectedChecksum: string, algorithm: string = 'sha256'): boolean => {
    const actualChecksum = checksum(data, algorithm)
    return actualChecksum === expectedChecksum
}

/**
 * Simple Caesar cipher implementation.
 * 
 * @param text - Text to encrypt/decrypt
 * @param shift - Number of positions to shift (default: 13)
 * @returns Encrypted/decrypted text
 */
export const caesarCipher = (text: string, shift: number = 13): string => {
    return text.replace(/[a-zA-Z]/g, (char: string) => {
        const isUpperCase = char === char.toUpperCase()
        const baseCharCode = isUpperCase ? 'A' : 'a'
        const shiftedCharCode = ((char.charCodeAt(0) - baseCharCode.charCodeAt(0) + shift) % 26)
        const newCharCode = (shiftedCharCode < 0 ? 26 + shiftedCharCode : shiftedCharCode) + baseCharCode.charCodeAt(0)
        return String.fromCharCode(newCharCode)
    })
}
