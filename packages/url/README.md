<div align="center">
  <a href="https://h3ravel.toneflix.net"  target="_blank">
    <img src="https://raw.githubusercontent.com/h3ravel/assets/refs/heads/main/logo-full.svg" width="200" alt="H3ravel Logo">
  </a>
  <h1 align="center"><a href="https://h3ravel.toneflix.net/guide/urls">H3ravel Url</a></h1>

[![Framework][ix]][lx]
[![URL Package Version][i1]][l1]
[![Downloads][d1]][l1]
[![Tests][tei]][tel]
[![License][lini]][linl]

</div>

# About H3ravel/url

Request-aware URI builder and URL manipulation utilities for [H3ravel](https://h3ravel.toneflix.net) framework.

## Installation

```bash
npm install @h3ravel/url
```

## Features

- **Static factories** for creating URLs from strings, paths, routes, and controller actions
- **Fluent builder API** for modifying URLs with immutable chaining
- **Request-aware helpers** for working with current request context
- **URL signing** capabilities for secure temporary URLs
- **Type-safe** query parameters and route parameters

## Usage

### Basic URL Creation

```typescript
import { Url } from '@h3ravel/url';

// From string
const url = Url.of('https://example.com/path');

// From path relative to app URL
const url = Url.to('/users');

// From named route
const url = Url.route('users.show', { id: 1 });

// From controller action
const url = Url.action('UserController@index');
```

### Fluent Builder API

```typescript
const url = Url.of('https://example.com')
  .withScheme('http')
  .withHost('test.com')
  .withPort(8000)
  .withPath('/users')
  .withQuery({ page: 2 })
  .withFragment('section-1')
  .toString();
// -> "http://test.com:8000/users?page=2#section-1"
```

### Request-Aware Helpers

```typescript
// Get current URL
url().current();

// Get full URL with query string
url().full();

// Get previous URL
url().previous();

// Get previous path only
url().previousPath();

// Get current query parameters
url().query();
```

### Signed URLs

```typescript
// Create signed route URL
const signedUrl = Url.signedRoute('users.show', { id: 1 });

// Create temporary signed route URL (expires in 5 minutes)
const tempUrl = Url.temporarySignedRoute(
  'users.index',
  {},
  Date.now() + 300000
);
```

## API Reference

### Static Methods

- `Url.of(string)` - Create from full URL string
- `Url.to(path)` - Create from path relative to app URL
- `Url.route(name, params)` - Create from named route
- `Url.signedRoute(name, params)` - Create signed route URL
- `Url.temporarySignedRoute(name, params, expiration)` - Create expiring signed route URL
- `Url.action(controller)` - Create from controller action

### Instance Methods

- `withScheme(scheme: string)` - Set URL scheme
- `withHost(host: string)` - Set URL host
- `withPort(port: number)` - Set URL port
- `withPath(path: string)` - Set URL path
- `withQuery(query: Record<string, any>)` - Set query parameters
- `withFragment(fragment: string)` - Set URL fragment
- `toString()` - Convert to string representation

### Request-Aware Functions

- `current()` - Get current request URL
- `full()` - Get full URL with query string
- `previous()` - Get previous request URL
- `previousPath()` - Get previous request path
- `query()` - Get current query parameters

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
[i1]: https://img.shields.io/npm/v/%40h3ravel%2Furl?style=flat-square&label=@h3ravel/url&color=%230970ce
[l1]: https://www.npmjs.com/package/@h3ravel/url
[d1]: https://img.shields.io/npm/dt/%40h3ravel%2Furl?style=flat-square&label=Downloads&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40h3ravel%2Furl
[linl]: https://github.com/h3ravel/framework/blob/main/LICENSE
[lini]: https://img.shields.io/github/license/h3ravel/framework
[tel]: https://github.com/h3ravel/framework/actions/workflows/test.yml
[tei]: https://github.com/h3ravel/framework/actions/workflows/test.yml/badge.svg
