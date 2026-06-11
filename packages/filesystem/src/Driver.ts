import type { CustomDiskConfig, CustomDiskDriverRegistry, DiskConfig, FtpDiskDriverConfig, LocalDiskDriverConfig, S3DiskDriverConfig } from '@h3ravel/foundation'
import { DriverContract, SignedURLOptions } from 'flydrive/types'

import { FSDriver } from 'flydrive/drivers/fs'
import { FtpDriver } from './FtpDriver'
import { IApplication } from '@h3ravel/contracts'
import { IFilesystemDriver } from '@h3ravel/foundation'
import { S3Driver } from 'flydrive/drivers/s3'

type BuiltInDriverMap = { [K in keyof Driver]: Driver[K] }

type DriverFor<K extends string> = K extends keyof BuiltInDriverMap
    ? ReturnType<BuiltInDriverMap[K]>
    : ReturnType<BuiltInDriverMap['custom']>

export class Driver extends IFilesystemDriver {
    private static customDrivers = new Map<
        keyof CustomDiskDriverRegistry | (string & {}),
        DriverContract | (new (config?: CustomDiskConfig) => DriverContract)
    >()

    constructor(private app: IApplication, private config: DiskConfig) {
        super()
    }

    static make<K extends 'local' | 'ftp' | 's3' | (string & {})> (
        app: IApplication,
        config: DiskConfig
    ): DriverFor<K> {
        const name = config.driver

        if (!['local', 'ftp', 's3'].includes(name) && !this.customDrivers.has(name)) {
            throw new Error(`Unsupported driver: ${name}`)
        }

        const driver = new Driver(app, config)

        if (this.customDrivers.has(name)) {
            return driver.custom(name) as DriverFor<K>
        }

        const factory = driver[name as 'local']

        return factory.call(driver) as DriverFor<K>
    }

    local () {
        const config = this.config as LocalDiskDriverConfig
        const app = this.app

        return new FSDriver({
            location: config.location ?? new URL(config.root!, import.meta.url),
            visibility: config.visibility ?? 'public',
            urlBuilder: {
                async generateURL (key: string, _path: string) {
                    // TODO: ensure this resolves to the actuall app url and works as expected
                    return app.make('config').get('app.url')(key)
                },

                async generateSignedURL (key: string, _path: string, _opts: SignedURLOptions) {
                    // TODO: ensure this resolves to the actuall app url and works as expected
                    return app.make('config').get('app.url')(key)
                },
            },
        })
    }

    s3 () {
        const config = this.config as S3DiskDriverConfig

        return new S3Driver({
            credentials: config.credentials ?? {
                accessKeyId: config.key!,
                secretAccessKey: config.secret!,
            },
            endpoint: config.endpoint,
            region: config.region,
            bucket: config.bucket,
            visibility: 'private',
            cdnUrl: config.cdnUrl ?? config.url,
        })
    }

    ftp () {
        const config = this.config as FtpDiskDriverConfig

        return new FtpDriver({
            host: config.host,
            username: config.username,
            password: config.password,
            port: config.port,
            verbose: config.verbose,
            privateKey: config.privateKey,
        })
    }

    custom (name: string): DriverContract {
        if (!Driver.customDrivers.has(name)) {
            throw new Error(`Unsupported driver: ${name} has not been registered`)
        }

        const DriverInstance = Driver.customDrivers.get(name)!

        if (typeof DriverInstance === 'function') {
            const config = this.config as CustomDiskConfig

            return new DriverInstance(config)
        }

        return DriverInstance
    }

    /**
     * Register a new custom driver
     * 
     * @param name 
     * @param driver 
     */
    static registerDriver (name: string, driver: DriverContract) {
        Driver.customDrivers.set(name, driver)
    }

    /**
     * Unregister a new custom driver
     * 
     * @param name 
     */
    static removeDriver (name: string) {
        Driver.customDrivers.delete(name)
    }
}