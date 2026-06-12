import type { CustomDiskDriverRegistry, DriverConfig, FileLike, FilesystemConfig, KnownDisks } from '@h3ravel/foundation'
import { DriveDirectory, DriveFile, DriveManager } from 'flydrive'
import { DriverContract, ObjectMetaData, ObjectVisibility, SignedURLOptions, WriteOptions } from 'flydrive/types'
import { rmSync, symlinkSync } from 'node:fs'

import { Driver } from './Driver'
import { IFilesystemManager } from '@h3ravel/foundation'
import { Logger } from '@h3ravel/shared'
import { Readable } from 'node:stream'
import path from 'node:path'

export class FilesystemManager<
    D extends keyof KnownDisks | keyof CustomDiskDriverRegistry = keyof KnownDisks | keyof CustomDiskDriverRegistry
> extends IFilesystemManager implements DriverContract {
    driver: DriveManager<any>
    services: Record<string, () => DriverContract> = {}
    diskName: D
    driverName: FilesystemConfig['disks'][D]['driver']

    constructor() {
        super()

        const disks = Object.entries(config('filesystem.disks', {})) as Array<[string, DriverConfig]>
        const customDrivers = config('filesystem.custom_drivers', {}) as Record<string, DriverContract>

        for (const [name, driver] of Object.entries(customDrivers)) {
            Driver.registerDriver(name, driver)
        }

        for (const [disk, config] of disks) {
            this.services[disk] = () => Driver.make(config)
        }

        this.diskName = config('filesystem.default')
        this.driverName = config(`filesystem.disks.${this.diskName}.driver`) as never
        this.driver = new DriveManager({
            default: config('filesystem.default'),
            services: this.services
        })
    }

    /**
     * Select a configured disk on the filesystem manager.
     * 
     * @param diskName  The name of the disk to use. If not provided, the default disk will be used.
     * @returns The filesystem manager instance
     */
    disk<K extends keyof KnownDisks | keyof CustomDiskDriverRegistry> (
        diskName: K
    ): this {
        this.diskName = diskName as never
        this.driverName = config(`filesystem.disks.${diskName}.driver`) as never
        this.driver = new DriveManager({
            default: diskName,
            services: this.services
        })

        return this
    }

    /**
     * Generate a unique name for the file based on random numbers and original extension
     * 
     * @param file  The file object containing the original name
     * @returns     A unique file name
     */
    generateName (file: { name?: string; originalname?: string }): string {
        const name = file.originalname || file.name || 'file'

        if (typeof config('filesystem.fileNameGenerator') === 'function') {
            return config('filesystem.fileNameGenerator')(name)
        }

        return Math.floor(Math.random() * 999999999999).toString() +
            '_' + Math.floor(Math.random() * 999999999999) +
            '.' + (name).split('.').pop()
    }

    /**
     * Save the file to the storage and return the public URL and the file path
     * 
     * @param file      The file object containing the file data
     * @param filePath  The path where the file should be saved
     * @param fileName  The name to save the file as (optional)
     * @returns         A tuple containing the public URL and the file path
     */
    async saveFile (
        file: FileLike,
        filePath: string = '',
        fileName?: string
    ): Promise<[string, string]> {
        const name = fileName || this.generateName(file)
        const drive = this.driver.use()

        if (file instanceof File && !file.buffer) {
            file.buffer = Buffer.from(await file.arrayBuffer())
        }

        await drive.put(path.join(filePath, name), file.buffer)

        const url = await drive.getUrl(path.join(filePath, name))
        const pth = this.driverName === 'local' ? path.join(filePath, name) : url

        return [url, pth]
    }

    /**
     * Return a boolean indicating if the file exists
     * 
     * @param key 
     * @returns 
     */
    exists (key: string): Promise<boolean> {
        return this.driver.use().exists(key)
    }

    /**
     * Return contents of a object for the given key as a UTF-8 string.
     * Should throw "E_CANNOT_READ_FILE" error when the file
     * does not exists.
     * 
     * @param key 
     * @returns 
     */
    get (key: string): Promise<string> {
        return this.driver.use().get(key)
    }

    /**
     * Get the name of the disk currently in use.
     * 
     * @returns 
     */
    getDiskName (): D {
        return this.diskName
    }

    /**
     * Get the name of the driver currently in use.
     * 
     * @returns 
     */
    getDriverName () {
        return this.driverName
    }

    /**
     * Get the driver currently in use.
     * 
     * @returns 
     */
    getDriver (): DriveManager<any> {
        return this.driver
    }

    /**
     * Return contents of a object for the given key as a Readable stream.
     * Should throw "E_CANNOT_READ_FILE" error when the file
     * does not exists.
     * 
     * @param key 
     * @returns 
     */
    getStream (key: string): Promise<Readable> {
        return this.driver.use().getStream(key)
    }

    /**
     * Return contents of an object for the given key as an Uint8Array.
     * Should throw "E_CANNOT_READ_FILE" error when the file
     * does not exists.
     * 
     * @param key 
     * @returns 
     */
    getBytes (key: string): Promise<Uint8Array> {
        return this.driver.use().getBytes(key)
    }

    /**
     * Return metadata of an object for the given key.
     * 
     * @param key 
     * @returns 
     */
    getMetaData (key: string): Promise<ObjectMetaData> {
        return this.driver.use().getMetaData(key)
    }

    /**
     * Return the visibility of the file
     * 
     * @param key 
     * @returns 
     */
    getVisibility (key: string): Promise<ObjectVisibility> {
        return this.driver.use().getVisibility(key)
    }

    /**
     * Return the public URL to access the file
     * 
     * @param key 
     * @returns 
     */
    getUrl (key: string): Promise<string> {
        return this.driver.use().getUrl(key)
    }

    /**
     * Return the signed/temporary URL to access the file
     * 
     * @param key 
     * @param options 
     * @returns 
     */
    getSignedUrl (key: string, options?: SignedURLOptions): Promise<string> {
        return this.driver.use().getSignedUrl(key, options)
    }

    /**
     * Return the signed/temporary URL that can be used to directly upload
     * the file contents to the storage.
     * 
     * @param key 
     * @param options 
     * @returns 
     */
    getSignedUploadUrl (key: string, options?: SignedURLOptions): Promise<string> {
        return this.driver.use().getSignedUploadUrl(key, options)
    }

    /**
     * Update the visibility of the file
     * 
     * @param key 
     * @param visibility 
     * @returns 
     */
    setVisibility (key: string, visibility: ObjectVisibility): Promise<void> {
        return this.driver.use().setVisibility(key, visibility)
    }

    /**
     * Write object to the destination with the provided
     * contents.
     * 
     * @param key 
     * @param contents 
     * @param options 
     * @returns 
     */
    put (
        key: string,
        contents: string | Uint8Array | FileLike,
        options?: WriteOptions
    ): Promise<void> {
        if (!(contents instanceof Uint8Array) && typeof contents !== 'string') {
            contents = contents.buffer
        }

        return this.driver.use().put(key, contents, options)
    }

    /**
     * Write object to the destination with the provided
     * contents as a readable stream
     * 
     * @param key 
     * @param contents 
     * @param options 
     * @returns 
     */
    putStream (key: string, contents: Readable, options?: WriteOptions): Promise<void> {
        return this.driver.use().putStream(key, contents, options)
    }

    /**
     * Copy the file from within the disk root location. Both
     * the "source" and "destination" will be the key names
     * and not absolute paths.
     * 
     * @param source 
     * @param destination 
     * @param options 
     * @returns 
     */
    copy (source: string, destination: string, options?: WriteOptions): Promise<void> {
        return this.driver.use().copy(source, destination, options)
    }

    /**
     * Move the file from within the disk root location. Both
     * the "source" and "destination" will be the key names
     * and not absolute paths.
     * 
     * @param source 
     * @param destination 
     * @param options 
     * @returns 
     */
    move (source: string, destination: string, options?: WriteOptions): Promise<void> {
        return this.driver.use().move(source, destination, options)
    }

    /**
     * Delete the file for the given key. Should not throw
     * error when file does not exist in first place
     * 
     * @param key 
     * @returns 
     */
    delete (key: string): Promise<void> {
        return this.driver.use().delete(key)
    }

    /**
     * Delete the files and directories matching the provided prefix.
     * 
     * @param prefix 
     * @returns 
     */
    deleteAll (prefix: string): Promise<void> {
        return this.driver.use().deleteAll(prefix)
    }

    /**
     * The list all method must return an array of objects with
     * the ability to paginate results (if supported).
     * 
     * @param prefix 
     * @param options 
     * @returns 
     */

    listAll (prefix: string, options?: {
        recursive?: boolean;
        paginationToken?: string;
    }): Promise<{
        paginationToken?: string;
        objects: Iterable<DriveFile | DriveDirectory>;
    }> {
        return this.driver.use().listAll(prefix, options)
    }

    /**
     * Switch bucket at runtime if supported.
     * 
     * @param bucket 
     * @returns 
     */
    bucket (bucket: string): DriverContract {
        return (this.driver.use() as any).bucket(bucket)
    }

    /**
     * Create symbolic links for all configured links in the application configuration.
     * 
     * @param param0 
     */
    link ({ force = false }: { force?: boolean } = {}): void {
        for (const link in config('filesystem.links')) {
            const target = config('filesystem.links')[link]

            const unlink = link.replace(base_path(), '')
            const untarget = target.replace(base_path(), '')

            try {
                if (force) rmSync(link, { recursive: true, force: true })
                symlinkSync(target, link)

                Logger.log([
                    [' SUCCESS ', 'bgGreen'],
                    [`[${unlink}]`, 'green'],
                    ['is now linked to', 'white'],
                    [`[${untarget}].`, 'green']
                ], ' ')
            } catch (error: any) {
                if (error.code === 'EEXIST') {
                    Logger.log([
                        [' INFO ', 'bgBlue'],
                        [`[${unlink}]`, 'green'],
                        ['is already linked to', 'white'],
                        [`[${untarget}].`, 'green']
                    ], ' ')
                } else {
                    Logger.log([
                        [' ERROR ', 'bgRed'],
                        ['Failed to create symbolic link from', 'white'],
                        [`[${unlink}]`, 'green'],
                        ['to', 'white'],
                        [`[${untarget}]`, 'green'],
                        [error.message, 'red']
                    ], ' ')
                }
            }
        }
    }
}
