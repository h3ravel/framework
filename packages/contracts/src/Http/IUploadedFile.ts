export abstract class IUploadedFile {
    abstract originalName: string
    abstract mimeType: string
    abstract size: number
    abstract content: File
    /**
     * Save to disk (Node environment only)
     */
    abstract moveTo (destination: string): Promise<void>;
}