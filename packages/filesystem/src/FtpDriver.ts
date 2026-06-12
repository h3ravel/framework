import { DriveDirectory, DriveFile } from 'flydrive'
import type {
    DriverContract,
    ObjectMetaData,
    ObjectVisibility,
    SignedURLOptions,
    WriteOptions,
} from 'flydrive/types'
import { createReadStream, createWriteStream } from 'node:fs'

import Client from 'ssh2-sftp-client'
import { IFtpDiskDriver } from '@h3ravel/foundation'
import { Readable } from 'node:stream'
import path from 'node:path'

export class FtpDriver extends IFtpDiskDriver implements DriverContract {
    private config: {
        host: string
        username: string
        password: string
        port?: number
        verbose?: boolean
        privateKey?: string
    }

    constructor(config: string | {
        host: string
        username: string
        password: string
        port?: number
        verbose?: boolean
        privateKey?: string
    }) {
        super()
        if (typeof config === 'string') {
            const url = new URL(config)

            this.config = {
                host: url.hostname,
                username: url.username,
                password: url.password,
                port: url.port ? parseInt(url.port, 10) : 22,
                verbose: url.searchParams.get('verbose') === 'true',
            }
        } else {
            this.config = config
        }
    }

    getConfig () {
        return this.config
    }

    private async init () {
        const client = new Client()

        await client.connect({
            host: this.config.host,
            username: this.config.username,
            password: this.config.password,
            port: this.config.port || 22,
        })

        return client
    }

    private async load<T> (handle: (client: Client) => Promise<T>): Promise<T> {
        const client = await this.init()

        try {
            return await handle(client)
        } catch (e) {
            if (this.config.verbose) {
                throw e
            }
        } finally {
            await client.end()
        }

        return null as any
    }

    /**
     * Return a boolean value indicating if the file exists
     * or not.
     */
    async exists (key: string): Promise<boolean> {
        const client = await this.load((client) => {
            return client.stat(key)
        }).catch(() => {
            return null
        })

        return !!client
    }

    /**
     * Return the file contents as a UTF-8 string. Throw an exception
     * if the file is missing.
     */
    async get (key: string): Promise<string> {
        const stream = await this.getStream(key)

        const chunks: Uint8Array[] = []
        for await (const chunk of stream) {
            chunks.push(chunk)
        }

        return Buffer.concat(chunks).toString('utf-8')
    }

    /**
     * Return the file contents as a Readable stream. Throw an exception
     * if the file is missing.
     */
    async getStream (key: string): Promise<Readable> {
        const dst = createWriteStream('/tmp/' + path.basename(key))
        await this.load((client) => {
            return client.get(key, dst)
        }).catch(() => {
            return null
        })

        return createReadStream('/tmp/' + path.basename(key))
    }

    /**
     * Return the file contents as a Uint8Array. Throw an exception
     * if the file is missing.
     */
    async getBytes (key: string): Promise<Uint8Array> {
        const content = await this.get(key)

        return new Uint8Array(Buffer.from(content, 'utf-8'))
    }

    /**
     * Return metadata of the file. Throw an exception
     * if the file is missing.
     */
    async getMetaData (key: string): Promise<ObjectMetaData> {
        const stat = await this.load((client) => {
            return client.stat(key)
        }).catch(() => {
            return null
        })

        if (!stat) {
            throw new Error('E_CANNOT_READ_FILE')
        }

        return {
            contentType: undefined,
            contentLength: stat.size,
            etag: key,
            lastModified: new Date(stat.modifyTime),
        }
    }

    /**
     * Return visibility of the file. Infer visibility from the initial
     * config, when the driver does not support the concept of visibility.
     */
    async getVisibility (key: string): Promise<ObjectVisibility> {
        void key

        return 'private'
    }

    /**
     * Return the public URL of the file. Throw an exception when the driver
     * does not support generating URLs.
     */
    async getUrl (key: string): Promise<string> {
        void key
        throw new Error('E_URL_GENERATION_UNSUPPORTED')
    }

    /**
     * Return the signed URL to serve a private file. Throw exception
     * when the driver does not support generating URLs.
     */
    async getSignedUrl (key: string, options?: SignedURLOptions): Promise<string> {
        void key
        void options
        throw new Error('E_URL_GENERATION_UNSUPPORTED')
    }
    /**
     * Return the signed/temporary URL that can be used to directly upload
     * the file contents to the storage.
     */
    async getSignedUploadUrl (key: string, options?: SignedURLOptions): Promise<string> {
        void key
        void options
        throw new Error('E_URL_GENERATION_UNSUPPORTED')
    }

    /**
     * Update the visibility of the file. Result in a NOOP
     * when the driver does not support the concept of
     * visibility.
     */
    async setVisibility (key: string, visibility: ObjectVisibility): Promise<void> {
        void key
        void visibility
    }

    /**
     * Create a new file or update an existing file. The contents
     * will be a UTF-8 string or "Uint8Array".
     */
    async put (key: string, contents: string | Uint8Array, options?: WriteOptions): Promise<void> {
        if (contents instanceof Uint8Array) {
            contents = Buffer.from(contents)
        }

        const stream = Readable.from(contents)

        await this.putStream(key, stream, options)
    }

    /**
     * Create a new file or update an existing file. The contents
     * will be a Readable stream.
     */
    async putStream (key: string, contents: Readable, options?: WriteOptions): Promise<void> {
        const dst = createWriteStream('/tmp/' + path.basename(key), {
            encoding: options?.contentEncoding as never || 'utf-8',
        })

        await new Promise((resolve, reject) => {
            contents.pipe(dst)
            contents.on('error', reject)
            dst.on('finish', resolve)
            dst.on('error', reject)
        })

        await this.load((client) => {
            return client.put('/tmp/' + path.basename(key), key)
        })
    }

    /**
     * Copy the existing file to the destination. Make sure the new file
     * has the same visibility as the existing file. It might require
     * manually fetching the visibility of the "source" file.
     */
    async copy (source: string, destination: string, options?: WriteOptions): Promise<void> {
        void options
        await this.load((client) => {
            return client.rcopy(source, destination)
        })
    }

    /**
     * Move the existing file to the destination. Make sure the new file
     * has the same visibility as the existing file. It might require
     * manually fetching the visibility of the "source" file.
     */
    async move (source: string, destination: string, options?: WriteOptions): Promise<void> {
        void options
        await this.load((client) => {
            return client.rename(source, destination)
        })
    }

    /**
     * Delete an existing file. Do not throw an error if the
     * file is already missing
     */
    async delete (key: string): Promise<void> {
        await this.load((client) => {
            return client.delete(key)
        }).catch(() => {
            return null
        })
    }

    /**
     * Delete all files inside a folder. Do not throw an error
     * if the folder does not exist or is empty.
     */
    async deleteAll (prefix: string): Promise<void> {
        await this.load((client) => {
            return client.rmdir(prefix, true)
        }).catch(() => {
            return null
        })
    }


    /**
     * Switch bucket at runtime if supported.
     */
    bucket (config: string | {
        host: string
        username: string
        password: string
        port?: number
        verbose?: boolean
        privateKey?: string
    }): DriverContract {
        return new FtpDriver(config)
    }

    /**
     * List all files from a given folder or the root of the storage.
     * Do not throw an error if the request folder does not exist.
     */
    async listAll (
        prefix: string,
        options?: {
            recursive?: boolean
            paginationToken?: string
        }
    ): Promise<{
        paginationToken?: string
        objects: Iterable<DriveFile | DriveDirectory>
    }> {
        void options

        const data = await this.load((client) => {
            return client.list(prefix)
        }).catch(() => {
            return null
        })

        return data ? {
            objects: data.map((file) => {
                if (file.type === 'd') {
                    return new DriveDirectory(file.name)
                } else {
                    return new DriveFile(file.name, this, {
                        contentType: undefined,
                        contentLength: file.size,
                        etag: file.name,
                        lastModified: new Date(file.modifyTime),
                    })
                }
            })
        } : { objects: [] }
    }

}
