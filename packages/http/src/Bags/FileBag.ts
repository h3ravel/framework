import { H3Event } from 'h3'
import { ParamBag } from './ParamBag'
import { UploadedFile } from '../UploadedFile'

type FileInput = UploadedFile | File | null | undefined

/**
 * FileBag is a container for uploaded files
 * for Node/H3 environments.
 */
export class FileBag extends ParamBag {
    protected parameters: Record<string, UploadedFile | UploadedFile[] | null> = {}

    constructor(
        parameters: Record<string, FileInput | FileInput[]> = {},
        /**
         * The current H3 H3Event instance
         */
        event: H3Event
    ) {
        super(parameters, event)
        this.replace(parameters)
    }

    /**
     * Replace all stored files.
     */
    public replace (files: Record<string, FileInput | FileInput[]> = {}): void {
        this.parameters = {}
        this.add(files)
    }

    /**
     * Set a file or array of files.
     */
    public set (key: string, value: FileInput | FileInput[]): void {
        if (Array.isArray(value)) {
            this.parameters[key] = value
                .map(v => (v ? this.convertFileInformation(v) : null))
                .filter(Boolean) as UploadedFile[]
        } else if (value) {
            this.parameters[key] = this.convertFileInformation(value)
        } else {
            this.parameters[key] = null
        }
    }

    /**
     * Add multiple files.
     */
    public add (files: Record<string, FileInput | FileInput[]> = {}): void {
        for (const [key, file] of Object.entries(files)) {
            this.set(key, file)
        }
    }

    /**
     * Get all stored files.
     */
    public all (): Record<string, UploadedFile | UploadedFile[] | null> {
        return this.parameters
    }

    /**
     * Normalize file input into UploadedFile instances.
     */
    protected convertFileInformation (file: FileInput): UploadedFile | null {
        if (!file) return null
        if (file instanceof UploadedFile) return file
        if (file instanceof File) return UploadedFile.createFromBase(file)

        throw new TypeError('Invalid file input — expected File or UploadedFile instance.')
    }
}
