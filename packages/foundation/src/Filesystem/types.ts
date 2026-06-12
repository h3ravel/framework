import { DriverContract, ObjectVisibility } from 'flydrive/types'

import type { GCSDriverOptions } from 'flydrive/drivers/gcs/types'

export interface FileLike {
    originalname: string
    buffer: Buffer
    mimetype: string
}

export interface CustomDiskDriverRegistry { }

export interface FtpDiskDriverConfig {
    host: string
    username: string
    password: string
    port?: number
    verbose?: boolean | undefined
    privateKey?: string | undefined
}

export interface S3DiskDriverConfig {
    credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string | undefined;
        credentialScope?: string | undefined;
        accountId?: string | undefined;
    },
    url?: string
    key?: string
    secret?: string
    endpoint?: string
    region?: string
    bucket: string
    visibility: ObjectVisibility
    cdnUrl?: string
}

export interface LocalDiskDriverConfig {
    root?: string
    location?: string | URL
    visibility: ObjectVisibility
    url?: string
}

export type GcsDiskDriverConfig = GCSDriverOptions

export type CustomDiskConfig = keyof CustomDiskDriverRegistry extends never
    ? { driver: string;[key: string]: any }
    : { [K in keyof CustomDiskDriverRegistry]: CustomDiskDriverRegistry[K] & { driver: K } }[keyof CustomDiskDriverRegistry]

export type DiskConfig =
    | LocalDiskDriverConfig & { driver: 'local' | 'public' }
    | FtpDiskDriverConfig & { driver: 'ftp' }
    | S3DiskDriverConfig & { driver: 's3' }
    | GcsDiskDriverConfig & { driver: 'gcs' }
    | CustomDiskConfig

export type DriverConfig<K extends 'ftp' | 'local' | 's3' | 'gcs' | (string & {}) = string & {}> =
    K extends 'ftp' ? FtpDiskDriverConfig :
    K extends 's3' ? S3DiskDriverConfig :
    K extends 'gcs' ? GcsDiskDriverConfig :
    K extends 'local' ? LocalDiskDriverConfig :
    K extends keyof CustomDiskDriverRegistry ? CustomDiskDriverRegistry[K] :
    DiskConfig

export type KnownDisks = {
    local: LocalDiskDriverConfig & { driver: 'local' }
    public: LocalDiskDriverConfig & { driver: 'local' }
    ftp: FtpDiskDriverConfig & { driver: 'ftp' }
    s3: S3DiskDriverConfig & { driver: 's3' }
    gcs: GcsDiskDriverConfig & { driver: 'gcs' }
}

export interface FilesystemConfig {
    default: 'local' | 'ftp' | 's3' | 'gcs' | keyof CustomDiskDriverRegistry | (string & {})
    disks: KnownDisks & CustomDiskDriverRegistry
    links: Record<string, string>
    custom_drivers?: Record<
        keyof CustomDiskDriverRegistry | (string & {}),
        DriverContract | (new (config?: CustomDiskConfig) => DriverContract)
    >
    fileNameGenerator?: (originalName: string) => string
}
