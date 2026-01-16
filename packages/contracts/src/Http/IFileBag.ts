import { IFileInput } from './Utils'
import { IParamBag } from './IParamBag'
import { IUploadedFile } from './IUploadedFile'

/**
 * FileBag is a container for uploaded files
 * for H3ravel App.
 */
export abstract class IFileBag extends IParamBag {
    /**
     * Replace all stored files.
     */
    abstract replace (files?: Record<string, IFileInput | IFileInput[]>): void;
    /**
     * Set a file or array of files.
     */
    abstract set (key: string, value: IFileInput | IFileInput[]): void;
    /**
     * Add multiple files.
     */
    abstract add (files?: Record<string, IFileInput | IFileInput[]>): void;
    /**
     * Get all stored files.
     */
    abstract all (): Record<string, IUploadedFile | IUploadedFile[] | null>;
}