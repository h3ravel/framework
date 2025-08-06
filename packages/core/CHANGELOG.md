# @h3ravel/core

## 1.0.6

### Patch Changes

- Updated dependencies
  - @h3ravel/shared@0.10.0

## 1.0.5

### Patch Changes

- Updated dependencies
  - @h3ravel/shared@0.9.0

## 1.0.4

### Patch Changes

- Updated dependencies
  - @h3ravel/shared@0.8.0

## 1.0.3

### Patch Changes

- chore: add download count to readme
- Updated dependencies
  - @h3ravel/shared@0.7.1

## 1.0.2

### Patch Changes

- Updated dependencies [b0d1b7c]
  - @h3ravel/shared@0.7.0

## 1.0.0

### Major Changes

- b40caeb: feat: make service providers sortable and unique while only loading the core providers by default.
  Service providers are no longer loaded by default, asides the ones provided by @h3ravel/core
  Service provides are sorted by an optional order and priority property.

### Patch Changes

- Updated dependencies [b40caeb]
  - @h3ravel/shared@0.6.0

## 0.5.0

### Minor Changes

- rebuild all dependencies

### Patch Changes

- Updated dependencies
  - @h3ravel/shared@0.5.0

## 0.4.0

### Minor Changes

- 8ceb2c1: implement the Application class directly since it already implements the IClass contract

### Patch Changes

- a27f452: chore: fix all linting issues.
- c906050: chore: migrate tests suite to jest
- Updated dependencies [8ceb2c1]
- Updated dependencies [a27f452]
- Updated dependencies [c906050]
  - @h3ravel/shared@0.4.0

## 0.3.0

### Minor Changes

- 3ff97bf: refactor: add a shared package to be extended by others to avoid cyclic dependency issues.

### Patch Changes

- Updated dependencies [3ff97bf]
  - @h3ravel/shared@0.3.0

## 0.2.0

### Minor Changes

- aea734f: Fix all known bugs and improved interdependecy between packages.

### Patch Changes

- Updated dependencies [aea734f]
  - @h3ravel/router@0.2.0
  - @h3ravel/shared@0.2.0
