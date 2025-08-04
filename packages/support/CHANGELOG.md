# @h3ravel/support

## 0.6.0

### Minor Changes

- b40caeb: feat: make service providers sortable and unique while only loading the core providers by default.
  Service providers are no longer loaded by default, asides the ones provided by @h3ravel/core
  Service provides are sorted by an optional order and priority property.

## 0.5.0

### Minor Changes

- rebuild all dependencies

## 0.4.0

### Minor Changes

- 8ceb2c1: implement the Application class directly since it already implements the IClass contract

### Patch Changes

- a27f452: chore: fix all linting issues.
- c906050: chore: migrate tests suite to jest

## 0.3.0

### Minor Changes

- 3ff97bf: refactor: add a shared package to be extended by others to avoid cyclic dependency issues.

## 0.2.0

### Minor Changes

- aea734f: Fix all known bugs and improved interdependecy between packages.
