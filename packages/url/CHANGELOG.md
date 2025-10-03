# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-02

### Added

- **Url class** - Request-aware URI builder with fluent API
- **Static factories** for creating URLs:
  - `Url.of(string)` - Create from full URL string
  - `Url.to(path)` - Create from path relative to app URL
  - `Url.route(name, params)` - Create from named route
  - `Url.signedRoute(name, params)` - Create signed route URL
  - `Url.temporarySignedRoute(name, params, expiration)` - Create expiring signed route URL
  - `Url.action(controller)` - Create from controller action (placeholder)
- **Fluent builder API** with immutable chaining:
  - `withScheme(scheme)` - Set URL scheme
  - `withHost(host)` - Set URL host
  - `withPort(port)` - Set URL port
  - `withPath(path)` - Set URL path
  - `withQuery(query)` - Set query parameters
  - `withQueryParams(params)` - Merge additional query parameters
  - `withFragment(fragment)` - Set URL fragment
- **Request-aware helpers**:
  - `current()` - Get current request URL
  - `full()` - Get full URL with query string
  - `previous()` - Get previous request URL
  - `previousPath()` - Get previous request path
  - `query()` - Get current query parameters
- **URL signing capabilities**:
  - `withSignature(app, expiration?)` - Add signature to URL
  - `hasValidSignature(app)` - Verify URL signature
- **Global helper functions**:
  - `url()` - Request-aware URL helpers
  - `route()` - Create route URL
  - `to()` - Create URL from path
  - `action()` - Create URL from controller action
  - `signedRoute()` - Create signed route URL
  - `temporarySignedRoute()` - Create temporary signed route URL
- **Service provider** - `UrlServiceProvider` for dependency injection
- **TypeScript contracts** - Full type safety with interfaces
- **Comprehensive tests** - 100% test coverage for all functionality
- **Documentation** - Complete README with usage examples

### Features

- **Immutable API** - All methods return new instances
- **Type-safe** - Full TypeScript support with proper typing
- **Framework integration** - Seamless integration with H3ravel ecosystem
- **Security** - HMAC-based URL signing with expiration support
- **Flexible** - Works with or without application context
- **Performance** - Efficient URL parsing and generation
- **Standards compliant** - Follows URL specification and encoding rules
