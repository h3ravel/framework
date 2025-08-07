# @h3ravel/example

## 1.3.0

### Minor Changes

- feat: add app to HttpContext interface

### Patch Changes

- Updated dependencies
  - @h3ravel/router@1.5.0
  - @h3ravel/shared@0.14.0
  - @h3ravel/config@1.1.1
  - @h3ravel/core@1.1.1
  - @h3ravel/http@5.0.1
  - @h3ravel/cache@5.0.1
  - @h3ravel/console@5.0.1
  - @h3ravel/database@5.0.1
  - @h3ravel/mail@5.0.1
  - @h3ravel/queue@5.0.1

## 1.2.0

### Minor Changes

- 6e249fe: feat: bind view as a self contained method to render views

### Patch Changes

- Updated dependencies [6e249fe]
  - @h3ravel/config@1.1.0
  - @h3ravel/shared@0.13.0
  - @h3ravel/core@1.1.0
  - @h3ravel/http@5.0.0
  - @h3ravel/router@1.4.3
  - @h3ravel/cache@5.0.0
  - @h3ravel/console@5.0.0
  - @h3ravel/database@5.0.0
  - @h3ravel/mail@5.0.0
  - @h3ravel/queue@5.0.0

## 1.1.2

### Patch Changes

- chore: regularize all interfaces.
- Updated dependencies
  - @h3ravel/cache@4.0.9
  - @h3ravel/config@1.0.9
  - @h3ravel/console@4.0.9
  - @h3ravel/core@1.0.9
  - @h3ravel/database@4.0.9
  - @h3ravel/http@4.2.2
  - @h3ravel/mail@4.0.9
  - @h3ravel/queue@4.0.9
  - @h3ravel/router@1.4.2
  - @h3ravel/shared@0.12.1

## 1.1.1

### Patch Changes

- Updated dependencies
  - @h3ravel/http@4.2.1
  - @h3ravel/router@1.4.1

## 1.1.0

### Minor Changes

- feat: add the current app instance to the Request and Response object

### Patch Changes

- Updated dependencies
  - @h3ravel/router@1.4.0
  - @h3ravel/shared@0.12.0
  - @h3ravel/http@4.2.0
  - @h3ravel/config@1.0.8
  - @h3ravel/core@1.0.8
  - @h3ravel/cache@4.0.8
  - @h3ravel/console@4.0.8
  - @h3ravel/database@4.0.8
  - @h3ravel/mail@4.0.8
  - @h3ravel/queue@4.0.8

## 1.0.6

### Patch Changes

- Updated dependencies
  - @h3ravel/router@1.3.0
  - @h3ravel/shared@0.11.0
  - @h3ravel/config@1.0.7
  - @h3ravel/core@1.0.7
  - @h3ravel/http@4.1.3
  - @h3ravel/cache@4.0.7
  - @h3ravel/console@4.0.7
  - @h3ravel/database@4.0.7
  - @h3ravel/mail@4.0.7
  - @h3ravel/queue@4.0.7

## 1.0.5

### Patch Changes

- Updated dependencies
  - @h3ravel/router@1.2.0
  - @h3ravel/shared@0.10.0
  - @h3ravel/config@1.0.6
  - @h3ravel/core@1.0.6
  - @h3ravel/http@4.1.2
  - @h3ravel/cache@4.0.6
  - @h3ravel/console@4.0.6
  - @h3ravel/database@4.0.6
  - @h3ravel/mail@4.0.6
  - @h3ravel/queue@4.0.6

## 1.0.4

### Patch Changes

- Updated dependencies
  - @h3ravel/router@1.1.0
  - @h3ravel/shared@0.9.0
  - @h3ravel/config@1.0.5
  - @h3ravel/core@1.0.5
  - @h3ravel/http@4.1.1
  - @h3ravel/cache@4.0.5
  - @h3ravel/console@4.0.5
  - @h3ravel/database@4.0.5
  - @h3ravel/mail@4.0.5
  - @h3ravel/queue@4.0.5

## 1.0.3

### Patch Changes

- Updated dependencies
  - @h3ravel/http@4.1.0
  - @h3ravel/shared@0.8.0
  - @h3ravel/router@1.0.4
  - @h3ravel/config@1.0.4
  - @h3ravel/core@1.0.4
  - @h3ravel/cache@4.0.4
  - @h3ravel/console@4.0.4
  - @h3ravel/database@4.0.4
  - @h3ravel/mail@4.0.4
  - @h3ravel/queue@4.0.4

## 1.0.2

### Patch Changes

- chore: add download count to readme
- Updated dependencies
  - @h3ravel/cache@4.0.3
  - @h3ravel/config@1.0.3
  - @h3ravel/console@4.0.3
  - @h3ravel/core@1.0.3
  - @h3ravel/database@4.0.3
  - @h3ravel/http@4.0.3
  - @h3ravel/mail@4.0.3
  - @h3ravel/queue@4.0.3
  - @h3ravel/router@1.0.3
  - @h3ravel/shared@0.7.1

## 1.0.1

### Patch Changes

- Updated dependencies [b0d1b7c]
  - @h3ravel/shared@0.7.0
  - @h3ravel/config@1.0.2
  - @h3ravel/http@4.0.2
  - @h3ravel/router@1.0.2
  - @h3ravel/core@1.0.2
  - @h3ravel/cache@4.0.2
  - @h3ravel/console@4.0.2
  - @h3ravel/database@4.0.2
  - @h3ravel/mail@4.0.2
  - @h3ravel/queue@4.0.2

## 1.0.0

### Major Changes

- b40caeb: feat: make service providers sortable and unique while only loading the core providers by default.
  Service providers are no longer loaded by default, asides the ones provided by @h3ravel/core
  Service provides are sorted by an optional order and priority property.

### Patch Changes

- Updated dependencies [b40caeb]
  - @h3ravel/config@1.0.0
  - @h3ravel/core@1.0.0
  - @h3ravel/router@1.0.0
  - @h3ravel/cache@4.0.0
  - @h3ravel/console@4.0.0
  - @h3ravel/database@4.0.0
  - @h3ravel/http@4.0.0
  - @h3ravel/mail@4.0.0
  - @h3ravel/queue@4.0.0
  - @h3ravel/shared@0.6.0

## 0.4.2

### Patch Changes

- Updated dependencies
  - @h3ravel/config@0.5.2

## 0.4.1

### Patch Changes

- Updated dependencies
  - @h3ravel/config@0.5.1

## 0.4.0

### Minor Changes

- rebuild all dependencies

### Patch Changes

- Updated dependencies
  - @h3ravel/config@0.5.0
  - @h3ravel/core@0.5.0
  - @h3ravel/http@3.0.0
  - @h3ravel/router@0.5.0
  - @h3ravel/shared@0.5.0

## 0.3.1

### Patch Changes

- a27f452: chore: fix all linting issues.
- c906050: chore: migrate tests suite to jest
- Updated dependencies [8ceb2c1]
- Updated dependencies [a27f452]
- Updated dependencies [c906050]
  - @h3ravel/config@0.4.0
  - @h3ravel/core@0.4.0
  - @h3ravel/router@0.4.0
  - @h3ravel/shared@0.4.0
  - @h3ravel/http@2.0.0

## 0.3.0

### Minor Changes

- 3ff97bf: refactor: add a shared package to be extended by others to avoid cyclic dependency issues.

### Patch Changes

- Updated dependencies [3ff97bf]
  - @h3ravel/config@0.3.0
  - @h3ravel/core@0.3.0
  - @h3ravel/http@1.0.0
  - @h3ravel/router@0.3.0
  - @h3ravel/shared@0.3.0

## 0.2.0

### Minor Changes

- aea734f: Fix all known bugs and improved interdependecy between packages.

### Patch Changes

- Updated dependencies [aea734f]
  - @h3ravel/config@0.2.0
  - @h3ravel/core@0.2.0
  - @h3ravel/http@0.2.0
  - @h3ravel/router@0.2.0
