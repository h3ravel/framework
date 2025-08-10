# @h3ravel/support

## 0.8.5

### Patch Changes

- feat: add /.\*\/promises$/gi to external

## 0.8.4

### Patch Changes

- feat: remove edge.js from external and add all node internals with /^node:.\*/gi

## 0.8.3

### Patch Changes

- feat: mark edge.js and fs-readdir-recursive as external

## 0.8.2

### Patch Changes

- feat: bundle fs-readdir-recursive

## 0.8.1

### Patch Changes

- feat: add files to package.json

## 0.8.0

### Minor Changes

- 79f4045: feat: add add exports to package.json

## 0.7.5

### Patch Changes

- feat: add homepage and repository to all packages.

## 0.7.4

### Patch Changes

- chore: update readme accros all packages

## 0.7.3

### Patch Changes

- chore: require the latest dependencies from the framework

## 0.7.2

### Patch Changes

- chore: regularize all interfaces.

## 0.7.1

### Patch Changes

- chore: add download count to readme

## 0.7.0

### Minor Changes

- b0d1b7c: feat: flip @h3ravel/shared dependency on @h3ravel/support as it should be.

### Patch Changes

- ce51a92: fix: re-export @h3ravel/shared object contract interfaces as types

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
