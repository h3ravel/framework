import { writeFile } from 'fs/promises'

export class UploadedFile {
    constructor(
        public originalName: string,
        public mimeType: string,
        public size: number,
        public content: File
    ) { }

    static createFromBase (file: File): UploadedFile {
        return new UploadedFile(file.name, file.type, file.size, file)
    }

    /**
     * Save to disk (Node environment only)
     */
    async moveTo (destination: string): Promise<void> {
        const buffer = Buffer.from(await this.content.arrayBuffer())
        await writeFile(destination, buffer)
    }
}
