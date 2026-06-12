<div align="center">
  <a href="https://h3ravel.toneflix.net"  target="_blank">
    <img src="https://raw.githubusercontent.com/h3ravel/assets/refs/heads/main/logo-full.svg" width="200" alt="H3ravel Logo">
  </a>
  <h1 align="center"><a href="https://h3ravel.toneflix.net">H3ravel Filesystem</a></h1>

[![Framework][ix]][lx]
[![Filesystem Package Version][i1]][l1]
[![Downloads][d1]][d1]
[![Tests][tei]][tel]
[![License][lini]][linl]

</div>

# About H3ravel/filesystem

This is the filesystem manager for the [H3ravel](https://h3ravel.toneflix.net) framework, providing shared file storage and filesystem utitlities for the framework.

## Google Cloud Storage

Install and configure the filesystem package with a `gcs` disk:

```ts
export default () => ({
  default: 'gcs',
  disks: {
    gcs: {
      driver: 'gcs',
      projectId: env('GOOGLE_CLOUD_PROJECT'),
      keyFilename: env('GOOGLE_APPLICATION_CREDENTIALS'),
      bucket: env('GOOGLE_CLOUD_STORAGE_BUCKET'),
      visibility: 'private',
      usingUniformAcl: true,
    },
  },
  links: {},
})
```

The driver also accepts an initialized `@google-cloud/storage` client through
the `storage` option.

## Custom Drivers

@h3ravel/filesystem allows you to configure and use custom storage drivers.

**CloudinaryFileDriver.ts**

```ts
import type { DriverContract, ObjectVisibility } from 'flydrive/types';
import type { CustomDiskConfig } from '@h3ravel/filesystem';

export class CloudinaryFileDriver implements DriverContract {
  constructor(private config?: CustomDiskConfig) {}
  async exists(key: string) {}
  async get(key: string) {}
  async getStream(key: string) {}
  async getBytes(key: string) {}
  async getMetaData(key: string) {}
  async getVisibility(): Promise<ObjectVisibility> {}
  async getUrl(key: string) {}
  async getSignedUrl(key: string) {}
  async getSignedUploadUrl(key: string) {}
  async setVisibility() {}
  async put() {}
  async putStream() {}
  async copy() {}
  async move() {}
  async delete() {}
  async deleteAll() {}
  async listAll() {}
  async bucket() {}
}
```

**src/config/filesystem.ts**

```ts
import { CloudinaryFileDriver } from '../CloudinaryFileDriver';
export default () => {
  return {
    default: 'images',
    disks: {
      images: {
        //...Other Disks Here
        driver: 'cloudinary',
      },
    },
    links: {},
    custom_drivers: {
      cloudinary: CloudinaryFileDriver,
    },
  };
};
```

To improve type safety and auto complete, you may augment the `CustomDiskDriverRegistry`

**env.d.ts**

```ts
declare module '@h3ravel/filesystem' {
  interface CustomDiskDriverRegistry {
    cloudinary: { cloud_name: string; api_key: string; api_secret: string };
  }
}
```

## Contributing

Thank you for considering contributing to the H3ravel framework! The [Contribution Guide](https://h3ravel.toneflix.net/contributing) can be found in the H3ravel documentation and will provide you with all the information you need to get started.

## Code of Conduct

In order to ensure that the H3ravel community is welcoming to all, please review and abide by the [Code of Conduct](#).

## Security Vulnerabilities

If you discover a security vulnerability within H3ravel, please send an e-mail to Legacy via hamzas.legacy@toneflix.ng. All security vulnerabilities will be promptly addressed.

## License

The H3ravel framework is open-sourced software licensed under the [MIT license](LICENSE).

[ix]: https://img.shields.io/npm/v/%40h3ravel%2Fcore?style=flat-square&label=Framework&color=%230970ce
[lx]: https://www.npmjs.com/package/@h3ravel/core
[i1]: https://img.shields.io/npm/v/%40h3ravel%2Fhttp?style=flat-square&label=@h3ravel/filesystem&color=%230970ce
[l1]: https://www.npmjs.com/package/@h3ravel/filesystem
[d1]: https://img.shields.io/npm/dt/%40h3ravel%2Fhttp?style=flat-square&label=Downloads&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40h3ravel%2Fhttp
[linl]: https://github.com/h3ravel/framework/blob/main/LICENSE
[lini]: https://img.shields.io/github/license/h3ravel/framework
[tel]: https://github.com/h3ravel/framework/actions/workflows/test.yml
[tei]: https://github.com/h3ravel/framework/actions/workflows/test.yml/badge.svg
