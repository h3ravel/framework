import { UploadedFile } from './UploadedFile'

export class FormRequest {
    protected dataset!: {
        files: Record<string, File | UploadedFile | (File | UploadedFile)[]>,
        input: Record<string, any>
    }

    constructor(data: FormData) {
        this.initialize(data)
    }

    /**
     * Initialize the data
     * @param data 
     */
    initialize (data: FormData) {
        this.dataset = {
            files: {},
            input: {},
        }

        for (const [rawKey, value] of data.entries()) {
            const key = rawKey.endsWith('[]') ? rawKey.slice(0, -2) : rawKey

            if (value instanceof UploadedFile || value instanceof File) {
                const uploaded = value instanceof UploadedFile
                    ? value
                    : UploadedFile.createFromBase(value)

                if (this.dataset.files[key]) {
                    const existing = this.dataset.files[key]

                    // Normalize to array
                    if (Array.isArray(existing)) {
                        existing.push(uploaded)
                    } else {
                        this.dataset.files[key] = [existing, uploaded]
                    }
                } else {
                    // Always assign as UploadedFile (single)
                    this.dataset.files[key] = uploaded
                }
            } else {
                if (this.dataset.input[key]) {
                    const existing = this.dataset.input[key]
                    if (Array.isArray(existing)) {
                        existing.push(value)
                    } else {
                        this.dataset.input[key] = [existing, value]
                    }
                } else {
                    this.dataset.input[key] = value
                }
            }
        }
    }

    /**
     * Get all uploaded files
     */
    public files (): Record<string, File | UploadedFile | (File | UploadedFile)[]> {
        return this.dataset.files
    }

    /**
     * Get all input fields
     */
    public input (): Record<string, any> {
        return this.dataset.input
    }

    /**
     * Get combined input and files
     * File entries take precedence if names overlap.
     */
    public all (): Record<string, any> {
        return Object.assign({}, this.dataset.input, this.dataset.files)
    }
}
