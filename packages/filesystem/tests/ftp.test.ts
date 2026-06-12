import { describe, expect, it, vi } from 'vitest'

import { FtpDriver } from '../src/FtpDriver'

const client = vi.hoisted(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    end: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({
        size: 12,
        modifyTime: Date.now(),
    }),
    get: vi.fn().mockImplementation((_key, destination) => {
        return new Promise<void>((resolve, reject) => {
            destination.once('error', reject)
            destination.end('Hello World\n', resolve)
        })
    }),
    list: vi.fn().mockResolvedValue([
        { type: '-', name: 'test.txt', size: 12, modifyTime: Date.now() },
        { type: 'd', name: 'nested', size: 0, modifyTime: Date.now() },
    ]),
}))

vi.mock('ssh2-sftp-client', () => ({
    default: class {
        connect = client.connect
        end = client.end
        stat = client.stat
        get = client.get
        list = client.list
    },
}))

const ftpDriver = new FtpDriver(process.env.FTP_CONNECTION || 'sftp://a.b.c.d:22')
const testPath = process.env.FTP_TEST_PATH || '/'

describe('Filesystem FTP Driver', () => {
    it('should be configurable with an object', async () => {
        const config = {
            host: 'ftp.example.com',
            username: 'username',
            password: 'password',
            port: 22,
            verbose: false,
        }
        const ftpDriver = new FtpDriver(config)

        expect(ftpDriver.getConfig()).toEqual(config)
    })

    it('should be configurable with a string', async () => {
        const config = 'ftp://username:password@ftp.example.com'
        const ftpDriver = new FtpDriver(config)

        expect(ftpDriver.getConfig()).toEqual({
            host: 'ftp.example.com',
            username: 'username',
            password: 'password',
            port: 22,
            verbose: false,
        })
    })

    it('should list files in a directory', async () => {
        const result = await ftpDriver.listAll(testPath)

        expect(Array.from(result.objects)).toHaveLength(2)
        expect(client.list).toHaveBeenCalledWith(testPath)
    })

    it('should exist', async () => {
        expect(await ftpDriver.exists(testPath + '/test.txt')).toBe(true)
    })

    it('should get stream from FTP server', async () => {
        const stream = await ftpDriver.getStream(testPath + '/test.txt')
        const chunks: Uint8Array[] = []
        for await (const chunk of stream) {
            chunks.push(chunk)
        }
        const content = Buffer.concat(chunks).toString('utf-8')
        expect(content).toBe('Hello World\n')
    })

    it('should get file from FTP server', async () => {
        const content = await ftpDriver.get(testPath + '/test.txt')
        expect(content).toBe('Hello World\n')
    })

    it('should get bytes from FTP server', async () => {
        const content = await ftpDriver.getBytes(testPath + '/test.txt')
        expect(Buffer.from(content).toString('utf-8')).toBe('Hello World\n')
    })
}, 10000 /* increase timeout for FTP operations */)
