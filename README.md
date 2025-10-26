<div align="center">
  <a href="https://h3ravel.toneflix.net"  target="_blank">
    <img src="https://raw.githubusercontent.com/h3ravel/assets/refs/heads/main/logo-full.svg" width="200" alt="H3ravel Logo">
  </a>
  <h1 align="center"><a href="https://h3ravel.toneflix.net">H3ravel Framework</a></h1>

[![Downloads][d1]][lx]
[![Framework][ix]][lx]
[![Core Package Version][i1]][l1]
[![Arquebus ORM][i12]][l12]
[![Musket CLI][i13]][l13]
[![Cache Package Version][i2]][l2]
[![Config Package Version][i3]][l3]
[![Console Package Version][i4]][l4]
[![Database Package Version][i5]][l5]
[![Http Package Version][i6]][l6]
[![Mail Package Version][i7]][l7]
[![Queue Package Version][i8]][l8]
[![Router Package Version][i9]][l9]
[![Shared Package Version][i10]][l10]
[![Support Package Version][i11]][l11]
[![Tests][tei]][tel]
[![License][lini]][linl]

</div>

# About H3ravel

H3ravel is a modern TypeScript runtime-agnostic web framework built on top of [H3](https://h3.dev), designed to bring the elegance and developer experience of [Laravel](https://laravel.com) to the JavaScript ecosystem.

# Installation

To get started, run the `create-h3ravel` script, which will seamlessly initialize a new project structure with all the necessary files and configurations tailored for [H3ravel](https://h3ravel.toneflix.net) development.

```sh
# Using npm
npm init h3ravel

# Using yarn
yarn create h3ravel

# Using pnpm
pnpm create h3ravel
```

# Documentation

More information can be found in the [H3ravel documentation](https://h3ravel.toneflix.net).

## Features

- Laravel-inspired architecture – Service Container, Service Providers, Middleware, Facades
- Clean Routing – Dedicated routes directory with web and api route files
- Controllers with decorators – Class-based controllers like Laravel
- HTTP Kernel – Centralized middleware and request lifecycle handling
- Arquebus ORM – Beautiful, expressive ORM inspired by Laravel's Eloquent, designed for TypeScript applications
- Musket CLI - Our Powerful Artisan-like command-line tool for generating code and running tasks
- Modular Services – Mail, Queue, Cache, Filesystem and Broadcasting support
- Runtime Agnostic – Works seamlessly across Node.js, Bun, and Deno
- Type-safe everything – Fully written in TypeScript

## Why H3ravel?

While modern JavaScript frameworks focus on speed and minimalism, they often lack the developer experience and structure found in PHP’s Laravel. H3ravel aims to fill that gap by providing:

- Laravel’s elegance – Familiar MVC patterns, expressive routing, service providers, and middleware.
- TypeScript-first approach – Strong typing and modern DX out of the box.
- Built on H3 – A lightweight, framework-agnostic HTTP library that’s:
  - Fast – Optimized for speed with minimal overhead.
  - Flexible – Works with any runtime or deployment target.
  - Composable – Lets us build a layered Laravel-like architecture without restrictions.
- Runtime agnosticism – Unlike many Node frameworks, H3ravel runs on Node.js, Bun, or Deno with no extra setup.

This combination delivers the productivity of Laravel while leveraging the modern JavaScript ecosystem and runtime flexibility.

## Philosophy

- Laravel DX, TypeScript speed – H3ravel brings Laravel’s expressive syntax and architecture to JavaScript with full type safety.
- Minimal, yet scalable – Built on H3’s tiny but powerful HTTP handling, keeping your app fast and maintainable.
- Runtime Freedom – Designed to run on Node.js, Bun, and Deno without code changes.
- Convention over configuration – Opinionated structure for faster development.

## Roadmap

- [x] Application container with service providers
- [x] Middleware pipeline and HTTP kernel
- [x] Routing system
- [x] Config management and environment handling
- [ ] Community Building
- [ ] Musket CLI (artisan-like commands)
- [ ] Cache Management
- [ ] Queues, Mail, Events, Broadcasting
- [ ] Arquebus ORM with relationships (Eloquent-style)
- [ ] First-class runtime adapters (Node, Bun, Deno)

## Development

### Install Dependencies

```sh
pnpm i
```

This might error out complaining about missing bin modules for `spawn` and `fire`, this is because the workspace setup depends on prebuilt (`dist`) workspace modules that wont be available on initial setup instead of using their `node_modules` counterpart, this is intentional for debugging purposes, we can fix this by ensuring all required modules are built and available by running:

```sh
pnpm build
```

### Example App

We provide an example app for development purpose at `examples/basic-app`

```sh
cd examples/basic-app

pnpm musket fire
# OR
pnpm musket build
```

## Contributing

Thank you for considering contributing to the H3ravel framework! The [Contribution Guide](https://h3ravel.toneflix.net/contributing) can be found in the H3ravel documentation and will provide you with all the information you need to get started.

## Code of Conduct

In order to ensure that the H3ravel community is welcoming to all, please review and abide by the [Code of Conduct](#).

## Security Vulnerabilities

If you discover a security vulnerability within H3ravel, please send an e-mail to Legacy via hamzas.legacy@toneflix.ng. All security vulnerabilities will be promptly addressed.

## License

The H3ravel framework is open-sourced software licensed under the [MIT license](LICENSE).

[d1]: https://img.shields.io/npm/dt/%40h3ravel%2Fcore?style=flat-square&label=Downloads&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40h3ravel%2Fcore
[ix]: https://img.shields.io/npm/v/%40h3ravel%2Fcore?style=flat-square&label=Framework&color=%230970ce
[lx]: https://www.npmjs.com/package/@h3ravel/core
[i1]: https://img.shields.io/npm/v/%40h3ravel%2Fcore?style=flat-square&label=@h3ravel/core&color=%230970ce
[l1]: https://www.npmjs.com/package/@h3ravel/core
[i2]: https://img.shields.io/npm/v/%40h3ravel%2Fcache?style=flat-square&label=@h3ravel/cache&color=%230970ce
[l2]: https://www.npmjs.com/package/@h3ravel/cache
[i3]: https://img.shields.io/npm/v/%40h3ravel%2Fconfig?style=flat-square&label=@h3ravel/config&color=%230970ce
[l3]: https://www.npmjs.com/package/@h3ravel/config
[i4]: https://img.shields.io/npm/v/%40h3ravel%2Fconsole?style=flat-square&label=@h3ravel/console&color=%230970ce
[l4]: https://www.npmjs.com/package/@h3ravel/console
[i5]: https://img.shields.io/npm/v/%40h3ravel%2Fdatabase?style=flat-square&label=@h3ravel/database&color=%230970ce
[l5]: https://www.npmjs.com/package/@h3ravel/database
[i6]: https://img.shields.io/npm/v/%40h3ravel%2Fhttp?style=flat-square&label=@h3ravel/http&color=%230970ce
[l6]: https://www.npmjs.com/package/@h3ravel/http
[i7]: https://img.shields.io/npm/v/%40h3ravel%2Fmail?style=flat-square&label=@h3ravel/mail&color=%230970ce
[l7]: https://www.npmjs.com/package/@h3ravel/mail
[i8]: https://img.shields.io/npm/v/%40h3ravel%2Fqueue?style=flat-square&label=@h3ravel/queue&color=%230970ce
[l8]: https://www.npmjs.com/package/@h3ravel/queue
[i9]: https://img.shields.io/npm/v/%40h3ravel%2Frouter?style=flat-square&label=@h3ravel/router&color=%230970ce
[l9]: https://www.npmjs.com/package/@h3ravel/router
[i10]: https://img.shields.io/npm/v/%40h3ravel%2Fshared?style=flat-square&label=@h3ravel/shared&color=%230970ce
[l10]: https://www.npmjs.com/package/@h3ravel/shared
[i11]: https://img.shields.io/npm/v/%40h3ravel%2Fsupport?style=flat-square&label=@h3ravel/support&color=%230970ce
[l11]: https://www.npmjs.com/package/@h3ravel/support
[i12]: https://img.shields.io/npm/v/%40h3ravel%2Farquebus?style=flat-square&label=@h3ravel/arquebus&color=%230970ce
[l12]: https://www.npmjs.com/package/@h3ravel/arquebus
[i13]: https://img.shields.io/npm/v/%40h3ravel%2Fmusket?style=flat-square&label=@h3ravel/musket&color=%230970ce
[l13]: https://www.npmjs.com/package/@h3ravel/musket
[linl]: https://github.com/h3ravel/framework/blob/main/LICENSE
[lini]: https://img.shields.io/github/license/h3ravel/framework
[tel]: https://github.com/h3ravel/framework/actions/workflows/test.yml
[tei]: https://github.com/h3ravel/framework/actions/workflows/test.yml/badge.svg
