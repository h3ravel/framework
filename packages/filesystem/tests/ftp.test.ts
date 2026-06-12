import { describe, expect, it } from 'vitest'

import { FtpDriver } from '../src/FtpDriver'

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

    it.skip('should list files in a directory', async () => {
        console.log(testPath, await ftpDriver.listAll(testPath))
    })

    it.skip('should exist', async () => {
        expect(await ftpDriver.exists(testPath + '/test.txt')).toBe(true)
    })

    it.skip('should get stream from FTP server', async () => {
        const stream = await ftpDriver.getStream(testPath + '/test.txt')
        const chunks: Uint8Array[] = []
        for await (const chunk of stream) {
            chunks.push(chunk)
        }
        const content = Buffer.concat(chunks).toString('utf-8')
        expect(content).toBe('Hello World\n')
    })

    it.skip('should get file from FTP server', async () => {
        const content = await ftpDriver.get(testPath + '/test.txt')
        expect(content).toBe('Hello World\n')
    })

    it.skip('should get bytes from FTP server', async () => {
        const content = await ftpDriver.getBytes(testPath + '/test.txt')
        expect(Buffer.from(content).toString('utf-8')).toBe('Hello World\n')
    })
}, 10000 /* increase timeout for FTP operations */)
