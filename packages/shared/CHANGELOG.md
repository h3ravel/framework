# @h3ravel/shared

## 0.9.0

### Minor Changes

- refactor!: make route definition more similar to the way it is handled in laravel.

## 0.8.0

### Minor Changes

- feat: convert Request params and query from a method to a property and add Request headers

## 0.7.1

### Patch Changes

- chore: add download count to readme

## 0.7.0

### Minor Changes

- b0d1b7c: feat: flip @h3ravel/shared dependency on @h3ravel/support as it should be.

## 0.6.0

### Minor Changes

- b40caeb: feat: make service providers sortable and unique while only loading the core providers by default.
  Service providers are no longer loaded by default, asides the ones provided by @h3ravel/core
  Service provides are sorted by an optional order and priority property.

### Patch Changes

- Updated dependencies [b40caeb]
  - @h3ravel/support@0.6.0

## 0.5.0

### Minor Changes

- rebuild all dependencies

### Patch Changes

- Updated dependencies
  - @h3ravel/support@0.5.0

## 0.4.0

### Minor Changes

- 8ceb2c1: implement the Application class directly since it already implements the IClass contract

### Patch Changes

- a27f452: chore: fix all linting issues.
- c906050: chore: migrate tests suite to jest
- Updated dependencies [8ceb2c1]
- Updated dependencies [a27f452]
- Updated dependencies [c906050]
  - @h3ravel/support@0.4.0

## 0.3.0

### Minor Changes

- 3ff97bf: refactor: add a shared package to be extended by others to avoid cyclic dependency issues.

### Patch Changes

- Updated dependencies [3ff97bf]
  - @h3ravel/support@0.3.0

## 0.2.0

### Minor Changes

- aea734f: Fix all known bugs and improved interdependecy between packages.
