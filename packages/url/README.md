# @h3ravel/url

Request-aware URI builder and URL manipulation utilities for H3ravel framework.

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
import { Url } from '@h3ravel/url'

// From string
const url = Url.of('https://example.com/path')

// From path relative to app URL
const url = Url.to('/users')

// From named route
const url = Url.route('users.show', { id: 1 })

// From controller action
const url = Url.action('UserController@index')
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
  .toString()
// -> "http://test.com:8000/users?page=2#section-1"
```

### Request-Aware Helpers

```typescript
// Get current URL
url().current()

// Get full URL with query string
url().full()

// Get previous URL
url().previous()

// Get previous path only
url().previousPath()

// Get current query parameters
url().query()
```

### Signed URLs

```typescript
// Create signed route URL
const signedUrl = Url.signedRoute('users.show', { id: 1 })

// Create temporary signed route URL (expires in 5 minutes)
const tempUrl = Url.temporarySignedRoute('users.index', {}, Date.now() + 300000)
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

## License

MIT
