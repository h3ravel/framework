# @h3ravel/mail

## 8.0.7

### Patch Changes

- feat: add /.\*\/promises$/gi to external
- Updated dependencies
  - @h3ravel/core@1.4.5

## 8.0.6

### Patch Changes

- feat: remove edge.js from external and add all node internals with /^node:.\*/gi
- Updated dependencies
  - @h3ravel/core@1.4.4

## 8.0.5

### Patch Changes

- feat: mark edge.js and fs-readdir-recursive as external
- Updated dependencies
  - @h3ravel/core@1.4.3

## 8.0.4

### Patch Changes

- feat: bundle fs-readdir-recursive
- Updated dependencies
  - @h3ravel/core@1.4.2

## 8.0.3

### Patch Changes

- feat: add files to package.json
- Updated dependencies
  - @h3ravel/core@1.4.1

## 8.0.2

### Patch Changes

- fix: nothing at all

## 8.0.0

### Minor Changes

- 79f4045: feat: add add exports to package.json

### Patch Changes

- Updated dependencies [79f4045]
  - @h3ravel/core@1.4.0

## 7.0.0

### Minor Changes

- feat: implement full IoC container resolution

### Patch Changes

- Updated dependencies
  - @h3ravel/core@1.3.0

## 6.0.2

### Patch Changes

- feat: add homepage and repository to all packages.
- Updated dependencies
  - @h3ravel/core@1.2.2

## 6.0.1

### Patch Changes

- chore: update readme accros all packages
- Updated dependencies
  - @h3ravel/core@1.2.1

## 6.0.0

### Patch Changes

- Updated dependencies [d07ff49]
  - @h3ravel/core@1.2.0

## 5.0.4

### Patch Changes

- db0dd70: chore: revert to old workspace core dependency

## 5.0.3

### Patch Changes

- version: explicitly set the latest version as pearDependency in requiring packages.

## 5.0.2

### Patch Changes

- chore: require the latest dependencies from the framework
- Updated dependencies
  - @h3ravel/core@1.1.2

## 5.0.1

### Patch Changes

- @h3ravel/core@1.1.1

## 5.0.0

### Patch Changes

- Updated dependencies [6e249fe]
  - @h3ravel/core@1.1.0

## 4.0.9

### Patch Changes

- chore: regularize all interfaces.
- Updated dependencies
  - @h3ravel/core@1.0.9

## 4.0.8

### Patch Changes

- @h3ravel/core@1.0.8

## 4.0.7

### Patch Changes

- @h3ravel/core@1.0.7

## 4.0.6

### Patch Changes

- @h3ravel/core@1.0.6

## 4.0.5

### Patch Changes

- @h3ravel/core@1.0.5

## 4.0.4

### Patch Changes

- @h3ravel/core@1.0.4

## 4.0.3

### Patch Changes

- chore: add download count to readme
- Updated dependencies
  - @h3ravel/core@1.0.3

## 4.0.2

### Patch Changes

- @h3ravel/core@1.0.2

## 4.0.0

### Minor Changes

- b40caeb: feat: make service providers sortable and unique while only loading the core providers by default.
  Service providers are no longer loaded by default, asides the ones provided by @h3ravel/core
  Service provides are sorted by an optional order and priority property.

### Patch Changes

- Updated dependencies [b40caeb]
  - @h3ravel/core@1.0.0

## 3.0.0

### Minor Changes

- rebuild all dependencies

### Patch Changes

- Updated dependencies
  - @h3ravel/core@0.5.0

## 2.0.0

### Patch Changes

- a27f452: chore: fix all linting issues.
- c906050: chore: migrate tests suite to jest
- Updated dependencies [8ceb2c1]
- Updated dependencies [a27f452]
- Updated dependencies [c906050]
  - @h3ravel/core@0.4.0

## 1.0.0

### Minor Changes

- 3ff97bf: refactor: add a shared package to be extended by others to avoid cyclic dependency issues.

### Patch Changes

- Updated dependencies [3ff97bf]
  - @h3ravel/core@0.3.0

## 0.2.0

### Minor Changes

- aea734f: Fix all known bugs and improved interdependecy between packages.

### Patch Changes

- Updated dependencies [aea734f]
  - @h3ravel/core@0.2.0
