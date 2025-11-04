export declare class IUploadedFile {
    originalName: string
    mimeType: string
    size: number
    content: File
    constructor(originalName: string, mimeType: string, size: number, content: File);
    static createFromBase (file: File): IUploadedFile;
    /**
     * Save to disk (Node environment only)
     */
    moveTo (destination: string): Promise<void>;
}