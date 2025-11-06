import { RuntimeException } from '@h3ravel/support'

/**
 * Http utility functions for IP handling.
 */
export class IpUtils {
    public static readonly PRIVATE_SUBNETS: string[] = [
        '127.0.0.0/8',    // RFC1700 (Loopback)
        '10.0.0.0/8',     // RFC1918
        '192.168.0.0/16', // RFC1918
        '172.16.0.0/12',  // RFC1918
        '169.254.0.0/16', // RFC3927
        '0.0.0.0/8',      // RFC5735
        '240.0.0.0/4',    // RFC1112
        '::1/128',        // Loopback
        'fc00::/7',       // Unique Local Address
        'fe80::/10',      // Link Local Address
        '::ffff:0:0/96',  // IPv4 translations
        '::/128',         // Unspecified address
    ]

    private static checkedIps: Record<string, boolean> = {}

    private constructor() { }

    /**
     * Checks if an IPv4 or IPv6 address is contained in the list of given IPs or subnets.
     * 
     * @param requestIp
     * @param ips List of IPs or subnets (can be a string if only a single one)
     */
    public static checkIp (requestIp?: string, ips?: string | string[]): boolean {
        if (ips && !Array.isArray(ips)) ips = [ips]
        const method = requestIp?.includes(':') ? this.checkIp6 : this.checkIp4

        for (const ip of ips ?? []) {
            if (method.call(this, requestIp ?? '', ip)) return true
        }
        return false
    }

    /**
     * Compares two IPv4 addresses or checks if one belongs to a CIDR subnet.
     *
     * @param requestIp
     * @param ip IPv4 address or subnet in CIDR notation
     *
     * @return bool Whether the request IP matches the IP, or whether the request IP is within the CIDR subnet
     */
    public static checkIp4 (requestIp: string, ip: string): boolean {
        const cacheKey = `${requestIp}-${ip}-v4`
        const cached = this.getCacheResult(cacheKey)
        if (cached !== null) return cached

        if (!this.isIPv4(requestIp)) return this.setCacheResult(cacheKey, false)

        let address: string
        let netmask: number

        if (ip.includes('/')) {
            const parts = ip.split('/', 2)
            address = parts[0]
            netmask = parseInt(parts[1]!, 10)

            if (netmask === 0)
                return this.setCacheResult(cacheKey, this.isIPv4(address))
            if (netmask < 0 || netmask > 32)
                return this.setCacheResult(cacheKey, false)
        } else {
            address = ip
            netmask = 32
        }

        const addrLong = this.ipv4ToLong(address)
        const reqLong = this.ipv4ToLong(requestIp)
        if (addrLong === null || reqLong === null)
            return this.setCacheResult(cacheKey, false)

        const mask = netmask === 0 ? 0 : (~0 << (32 - netmask)) >>> 0
        const result = (addrLong & mask) === (reqLong & mask)
        return this.setCacheResult(cacheKey, result)
    }


    /**
     * Compares two IPv6 addresses or checks if one belongs to a CIDR subnet.
     * 
     * @see https://github.com/dsp/v6tools
     *
     * @param requestIp
     * @param ip IPv6 address or subnet in CIDR notation
     *
     * @throws {RuntimeException} When IPV6 support is not enabled
     */
    public static checkIp6 (requestIp: string, ip: string): boolean {
        const cacheKey = `${requestIp}-${ip}-v6`
        const cached = this.getCacheResult(cacheKey)
        if (cached !== null) return cached

        if (!this.isIPv6(requestIp)) return this.setCacheResult(cacheKey, false)

        let address: string
        let netmask: number

        if (ip.includes('/')) {
            const parts = ip.split('/', 2)
            address = parts[0]
            netmask = parseInt(parts[1]!, 10)

            if (!this.isIPv6(address)) return this.setCacheResult(cacheKey, false)
            if (netmask < 1 || netmask > 128)
                return this.setCacheResult(cacheKey, false)
        } else {
            address = ip
            netmask = 128
        }

        const addrBytes = this.inetPton6(address)
        const reqBytes = this.inetPton6(requestIp)
        if (!addrBytes || !reqBytes) return this.setCacheResult(cacheKey, false)

        const bytesToCheck = Math.ceil(netmask / 8)
        for (let i = 0; i < bytesToCheck; i++) {
            const left = netmask - i * 8
            const bits = left >= 8 ? 8 : left
            const mask = 0xff << (8 - bits)
            if ((addrBytes[i] & mask) !== (reqBytes[i] & mask))
                return this.setCacheResult(cacheKey, false)
        }

        return this.setCacheResult(cacheKey, true)
    }

    /**
     * Anonymizes an IPv4/IPv6 by zeroing out trailing bytes.
     *
     * @param ip
     * @param v4Bytes
     * @param v6Bytes
     */
    public static anonymize (ip: string, v4Bytes = 1, v6Bytes = 8): string {
        if (v4Bytes < 0 || v6Bytes < 0)
            throw new RuntimeException('Cannot anonymize less than 0 bytes.')
        if (v4Bytes > 4 || v6Bytes > 16)
            throw new RuntimeException('Cannot anonymize more than 4 bytes for IPv4 and 16 bytes for IPv6.')

        if (ip.includes('%')) ip = ip.split('%')[0] // Remove local scope

        let wrappedIPv6 = false
        if (ip.startsWith('[') && ip.endsWith(']')) {
            wrappedIPv6 = true
            ip = ip.slice(1, -1)
        }

        const packed = this.inetPton(ip)
        if (!packed) throw new RuntimeException('Invalid IP address')

        let mask: Uint8Array
        if (packed.length === 4) {
            mask = new Uint8Array(4)
            mask.fill(255, 0, 4 - v4Bytes)
            mask.fill(0, 4 - v4Bytes)
        } else {
            mask = new Uint8Array(16)
            mask.fill(255, 0, 16 - v6Bytes)
            mask.fill(0, 16 - v6Bytes)
        }

        const anon = new Uint8Array(packed.length)
        for (let i = 0; i < packed.length; i++) {
            anon[i] = packed[i]! & mask[i]!
        }

        const result = this.inetNtop(anon)
        return wrappedIPv6 ? `[${result}]` : result
    }

    /**
     * Checks if IP is within private subnets.
     */
    public static isPrivateIp (requestIp: string): boolean {
        return this.checkIp(requestIp, this.PRIVATE_SUBNETS)
    }

    // -------------------
    // Utility Methods
    // -------------------

    private static isIPv4 (ip: string): boolean {
        return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)
    }

    private static isIPv6 (ip: string): boolean {
        return ip.includes(':')
    }

    private static ipv4ToLong (ip: string): number | null {
        const parts = ip.split('.').map((n) => parseInt(n, 10))
        if (parts.length !== 4 || parts.some((n) => n < 0 || n > 255)) return null
        return (
            ((parts[0] << 24) >>> 0) +
            ((parts[1] << 16) >>> 0) +
            ((parts[2] << 8) >>> 0) +
            parts[3]
        ) >>> 0
    }

    private static inetPton (ip: string): Uint8Array | null {
        try {
            return this.isIPv4(ip) ? this.inetPton4(ip) : this.inetPton6(ip)
        } catch {
            return null
        }
    }

    private static inetPton4 (ip: string): Uint8Array {
        return new Uint8Array(ip.split('.').map((n) => parseInt(n, 10)))
    }

    private static inetPton6 (ip: string): Uint8Array | null {
        const buf = new Uint8Array(16)
        try {
            const parts = ip.split('::')
            const left = parts[0] ? parts[0].split(':') : []
            const right = parts[1] ? parts[1].split(':') : []
            const fill = 8 - (left.length + right.length)

            const full = [...left, ...Array(fill).fill('0'), ...right].map((p) =>
                parseInt(p || '0', 16)
            )

            for (let i = 0; i < 8; i++) {
                buf[i * 2] = (full[i]! >> 8) & 0xff
                buf[i * 2 + 1] = full[i]! & 0xff
            }
            return buf
        } catch {
            return null
        }
    }

    private static inetNtop (buf: Uint8Array): string {
        if (buf.length === 4) {
            return Array.from(buf).join('.')
        }
        const words = []
        for (let i = 0; i < 16; i += 2)
            words.push(((buf[i]! << 8) | buf[i + 1]!).toString(16))
        return words.join(':').replace(/(^|:)0(:0)*:0(:|$)/, '::')
    }

    private static getCacheResult (key: string): boolean | null {
        if (key in this.checkedIps) {
            const val = this.checkedIps[key]
            delete this.checkedIps[key]
            this.checkedIps[key] = val // move to end (LRU)
            return val
        }
        return null
    }

    private static setCacheResult (key: string, result: boolean): boolean {
        if (Object.keys(this.checkedIps).length > 1000) {
            const entries = Object.entries(this.checkedIps).slice(500)
            this.checkedIps = Object.fromEntries(entries)
        }
        this.checkedIps[key] = result
        return result
    }
}
