# @h3ravel/shared

## 0.16.1

### Patch Changes

- feat: add files to package.json

## 0.16.0

### Minor Changes

- 79f4045: feat: add add exports to package.json

## 0.15.4

### Patch Changes

- feat: implement full IoC container resolution

## 0.15.3

### Patch Changes

- e3b3d6c: feat: add downloads count shield.

## 0.15.2

### Patch Changes

- feat: add homepage and repository to all packages.

## 0.15.1

### Patch Changes

- chore: update readme accros all packages

## 0.15.0

### Minor Changes

- d07ff49: feat: reserve the `app.` namespace for generic service provider resolution.

## 0.14.0

### Minor Changes

- feat: add app to HttpContext interface

## 0.13.0

### Minor Changes

- 6e249fe: feat: bind view as a self contained method to render views

## 0.12.1

### Patch Changes

- chore: regularize all interfaces.

## 0.12.0

### Minor Changes

- feat: add the current app instance to the Request and Response object

## 0.11.0

### Minor Changes

- remove 'name' from RouterEnd and only join in apiResource.

## 0.10.0

### Minor Changes

- feat: hide RouterEnd from itslelf to prevent unintentional chaining.

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
