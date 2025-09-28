<div align="center">
  <a href="https://h3ravel.toneflix.net"  target="_blank">
    <img src="https://raw.githubusercontent.com/h3ravel/assets/refs/heads/main/logo-full.svg" width="200" alt="H3ravel Logo">
  </a>
  <h1 align="center"><a href="https://h3ravel.toneflix.net/arquebus">H3ravel Queue</a></h1>

[![Framework][ix]][lx]
[![Mail Package Version][i1]][l1]
[![Downloads][d1]][d1]
[![Tests][tei]][tel]
[![License][lini]][linl]

</div>

# About H3ravel/queue

This is the queue mangement and handling system for the [H3ravel](https://h3ravel.toneflix.net) framework.

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
[i1]: https://img.shields.io/npm/v/%40h3ravel%2Fqueue?style=flat-square&label=@h3ravel/queue&color=%230970ce
[l1]: https://www.npmjs.com/package/@h3ravel/queue
[d1]: https://img.shields.io/npm/dt/%40h3ravel%2Fqueue?style=flat-square&label=Downloads&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40h3ravel%2Fqueue
[linl]: https://github.com/h3ravel/framework/blob/main/LICENSE
[lini]: https://img.shields.io/github/license/h3ravel/framework
[tel]: https://github.com/h3ravel/framework/actions/workflows/test.yml
[tei]: https://github.com/h3ravel/framework/actions/workflows/test.yml/badge.svg


# Queue Package

This package provides background job processing with multiple drivers. Inspired by Laravel queues.

## Features
- Dispatch jobs to different drivers (memory, database, redis stub).
- Worker processes jobs and supports retry/backoff.
- Familiar developer experience with some unique twists.

## Usage

### Creating a Job
```ts
import { JobContract } from "@h3ravel/queue";

export class SendEmailJob implements JobContract {
  constructor(private email: string) {}

  async handle() {
    console.log(`Sending email to ${this.email}`);
  }

  serialize() {
    return { email: this.email };
  }
}
