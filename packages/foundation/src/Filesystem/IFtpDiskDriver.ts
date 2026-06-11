import { DriveDirectory, DriveFile } from 'flydrive'
import type {
    DriverContract,
    ObjectMetaData,
    ObjectVisibility,
    SignedURLOptions,
    WriteOptions,
} from 'flydrive/types'

import { Readable } from 'node:stream'

export abstract class IFtpDiskDriver implements DriverContract {
    abstract getConfig (): {
        host: string;
        username: string;
        password: string;
        port?: number | undefined;
        verbose?: boolean | undefined;
        privateKey?: string | undefined;
    }

    /**
     * Return a boolean value indicating if the file exists
     * or not.
     */
    abstract exists (key: string): Promise<boolean>

    /**
     * Return the file contents as a UTF-8 string. Throw an exception
     * if the file is missing.
     */
    abstract get (key: string): Promise<string>

    /**
     * Return the file contents as a Readable stream. Throw an exception
     * if the file is missing.
     */
    abstract getStream (key: string): Promise<Readable>

    /**
     * Return the file contents as a Uint8Array. Throw an exception
     * if the file is missing.
     */
    abstract getBytes (key: string): Promise<Uint8Array>

    /**
     * Return metadata of the file. Throw an exception
     * if the file is missing.
     */
    abstract getMetaData (key: string): Promise<ObjectMetaData>

    /**
     * Return visibility of the file. Infer visibility from the initial
     * config, when the driver does not support the concept of visibility.
     */
    abstract getVisibility (key: string): Promise<ObjectVisibility>

    /**
     * Return the public URL of the file. Throw an exception when the driver
     * does not support generating URLs.
     */
    abstract getUrl (key: string): Promise<string>

    /**
     * Return the signed URL to serve a private file. Throw exception
     * when the driver does not support generating URLs.
     */
    abstract getSignedUrl (key: string, options?: SignedURLOptions): Promise<string>

    /**
     * Return the signed/temporary URL that can be used to directly upload
     * the file contents to the storage.
     */
    abstract getSignedUploadUrl (key: string, options?: SignedURLOptions): Promise<string>

    /**
     * Update the visibility of the file. Result in a NOOP
     * when the driver does not support the concept of
     * visibility.
     */
    abstract setVisibility (key: string, visibility: ObjectVisibility): Promise<void>

    /**
     * Create a new file or update an existing file. The contents
     * will be a UTF-8 string or "Uint8Array".
     */
    abstract put (key: string, contents: string | Uint8Array, options?: WriteOptions): Promise<void>

    /**
     * Create a new file or update an existing file. The contents
     * will be a Readable stream.
     */
    abstract putStream (key: string, contents: Readable, options?: WriteOptions): Promise<void>

    /**
     * Copy the existing file to the destination. Make sure the new file
     * has the same visibility as the existing file. It might require
     * manually fetching the visibility of the "source" file.
     */
    abstract copy (source: string, destination: string, options?: WriteOptions): Promise<void>

    /**
     * Move the existing file to the destination. Make sure the new file
     * has the same visibility as the existing file. It might require
     * manually fetching the visibility of the "source" file.
     */
    abstract move (source: string, destination: string, options?: WriteOptions): Promise<void>

    /**
     * Delete an existing file. Do not throw an error if the
     * file is already missing
     */
    abstract delete (key: string): Promise<void>

    /**
     * Delete all files inside a folder. Do not throw an error
     * if the folder does not exist or is empty.
     */
    abstract deleteAll (prefix: string): Promise<void>


    /**
     * Switch bucket at runtime if supported.
     */
    abstract bucket (config: string | {
        host: string
        username: string
        password: string
        port?: number
        verbose?: boolean
        privateKey?: string
    }): DriverContract

    /**
     * List all files from a given folder or the root of the storage.
     * Do not throw an error if the request folder does not exist.
     */
    abstract listAll (
        prefix: string,
        options?: {
            recursive?: boolean
            paginationToken?: string
        }
    ): Promise<{
        paginationToken?: string
        objects: Iterable<DriveFile | DriveDirectory>
    }>
}
