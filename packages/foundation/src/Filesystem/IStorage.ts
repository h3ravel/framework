import { CustomDiskDriverRegistry, FileLike, FilesystemConfig, KnownDisks } from './types'
import { DriveDirectory, DriveFile, DriveManager } from 'flydrive'
import { DriverContract, ObjectMetaData, ObjectVisibility, SignedURLOptions, WriteOptions } from 'flydrive/types'

import { Readable } from 'node:stream'

export abstract class IStorage<
    D extends keyof KnownDisks | keyof CustomDiskDriverRegistry = keyof KnownDisks | keyof CustomDiskDriverRegistry
> implements DriverContract {
    abstract driver: DriveManager<any>
    abstract services: Record<string, () => DriverContract>
    abstract diskName: D
    abstract driverName: FilesystemConfig['disks'][D]['driver']

    /**
     * Static method to get a disk instance directly from the Storage class without needing to instantiate it first.
     * 
     * @param diskName  The name of the disk to use. If not provided, the default disk will be used.
     * @returns A Storage instance
     */
    abstract disk<K extends keyof KnownDisks | keyof CustomDiskDriverRegistry> (
        diskName: K
    ): this

    /**
     * Generate a unique name for the file based on random numbers and original extension
     * 
     * @param file  The file object containing the original name
     * @returns     A unique file name
     */
    abstract generateName (file: { name?: string; originalname?: string }): string

    /**
     * Save the file to the storage and return the public URL and the file path
     * 
     * @param file      The file object containing the file data
     * @param filePath  The path where the file should be saved
     * @param fileName  The name to save the file as (optional)
     * @returns         A tuple containing the public URL and the file path
     */
    abstract saveFile (
        file: FileLike,
        filePath?: string,
        fileName?: string
    ): Promise<[string, string]>

    /**
     * Return a boolean indicating if the file exists
     * 
     * @param key 
     * @returns 
     */
    abstract exists (key: string): Promise<boolean>

    /**
     * Return contents of a object for the given key as a UTF-8 string.
     * Should throw "E_CANNOT_READ_FILE" error when the file
     * does not exists.
     * 
     * @param key 
     * @returns 
     */
    abstract get (key: string): Promise<string>

    /**
     * Get the name of the disk currently in use.
     * 
     * @returns 
     */
    abstract getDiskName (): D

    /**
     * Get the name of the driver currently in use.
     * 
     * @returns 
     */
    abstract getDriverName (): FilesystemConfig['disks'][D]['driver']

    /**
     * Get the driver currently in use.
     * 
     * @returns 
     */
    abstract getDriver (): DriveManager<any>

    /**
     * Return contents of a object for the given key as a Readable stream.
     * Should throw "E_CANNOT_READ_FILE" error when the file
     * does not exists.
     * 
     * @param key 
     * @returns 
     */
    abstract getStream (key: string): Promise<Readable>

    /**
     * Return contents of an object for the given key as an Uint8Array.
     * Should throw "E_CANNOT_READ_FILE" error when the file
     * does not exists.
     * 
     * @param key 
     * @returns 
     */
    abstract getBytes (key: string): Promise<Uint8Array>

    /**
     * Return metadata of an object for the given key.
     * 
     * @param key 
     * @returns 
     */
    abstract getMetaData (key: string): Promise<ObjectMetaData>

    /**
     * Return the visibility of the file
     * 
     * @param key 
     * @returns 
     */
    abstract getVisibility (key: string): Promise<ObjectVisibility>

    /**
     * Return the public URL to access the file
     * 
     * @param key 
     * @returns 
     */
    abstract getUrl (key: string): Promise<string>

    /**
     * Return the signed/temporary URL to access the file
     * 
     * @param key 
     * @param options 
     * @returns 
     */
    abstract getSignedUrl (key: string, options?: SignedURLOptions): Promise<string>

    /**
     * Return the signed/temporary URL that can be used to directly upload
     * the file contents to the storage.
     * 
     * @param key 
     * @param options 
     * @returns 
     */
    abstract getSignedUploadUrl (key: string, options?: SignedURLOptions): Promise<string>

    /**
     * Update the visibility of the file
     * 
     * @param key 
     * @param visibility 
     * @returns 
     */
    abstract setVisibility (key: string, visibility: ObjectVisibility): Promise<void>

    /**
     * Write object to the destination with the provided
     * contents.
     * 
     * @param key 
     * @param contents 
     * @param options 
     * @returns 
     */
    abstract put (
        key: string,
        contents: string | Uint8Array | FileLike,
        options?: WriteOptions
    ): Promise<void>

    /**
     * Write object to the destination with the provided
     * contents as a readable stream
     * 
     * @param key 
     * @param contents 
     * @param options 
     * @returns 
     */
    abstract putStream (key: string, contents: Readable, options?: WriteOptions): Promise<void>

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
    abstract copy (source: string, destination: string, options?: WriteOptions): Promise<void>

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
    abstract move (source: string, destination: string, options?: WriteOptions): Promise<void>

    /**
     * Delete the file for the given key. Should not throw
     * error when file does not exist in first place
     * 
     * @param key 
     * @returns 
     */
    abstract delete (key: string): Promise<void>

    /**
     * Delete the files and directories matching the provided prefix.
     * 
     * @param prefix 
     * @returns 
     */
    abstract deleteAll (prefix: string): Promise<void>

    /**
     * The list all method must return an array of objects with
     * the ability to paginate results (if supported).
     * 
     * @param prefix 
     * @param options 
     * @returns 
     */

    abstract listAll (prefix: string, options?: {
        recursive?: boolean;
        paginationToken?: string;
    }): Promise<{
        paginationToken?: string;
        objects: Iterable<DriveFile | DriveDirectory>;
    }>

    /**
     * Switch bucket at runtime if supported.
     * 
     * @param bucket 
     * @returns 
     */
    abstract bucket (bucket: string): DriverContract

    /**
     * Create symbolic links for all configured links in the application configuration.
     * 
     * @param options 
     */
    abstract link (options: { force?: boolean }): void
}