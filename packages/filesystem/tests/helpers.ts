import type { DriverContract, ObjectVisibility } from 'flydrive/types'
import { Readable } from 'node:stream'

export const driver: DriverContract = {
    exists: async (key: string) => !!key,
    get: async (key: string) => 'custom driver content' + key,
    getStream: async (key: string) => Readable.from('custom driver content' + key),
    getBytes: async (key: string) => new Uint8Array(Buffer.from('custom driver content' + key)),
    getMetaData: async (key: string) => ({
        name: key,
        contentLength: 21,
        contentType: 'text/plain',
        etag: 'custom',
        lastModified: new Date('2026-01-01T00:00:00.000Z'),
    }),
    getVisibility: async (): Promise<ObjectVisibility> => 'public',
    getUrl: async (key: string) => `custom://${key}`,
    getSignedUrl: async (key: string) => `custom+signed://${key}`,
    getSignedUploadUrl: async (key: string) => `custom+upload://${key}`,
    setVisibility: async () => undefined,
    put: async () => undefined,
    putStream: async () => undefined,
    copy: async () => undefined,
    move: async () => undefined,
    delete: async () => undefined,
    deleteAll: async () => undefined,
    listAll: async () => ({ objects: [] }),
    bucket: () => driver,
} satisfies DriverContract