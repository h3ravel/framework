import { DriverContract } from 'flydrive/types'
import { FSDriver } from 'flydrive/drivers/fs'
import { IFtpDiskDriver } from './IFtpDiskDriver'
import { S3Driver } from 'flydrive/drivers/s3'

export abstract class IFilesystemDriver {
    abstract local (): FSDriver

    abstract s3 (): S3Driver

    abstract ftp (): IFtpDiskDriver

    abstract custom (name: string): DriverContract
}