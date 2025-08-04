---
'@h3ravel/example': major
'@h3ravel/config': major
'@h3ravel/core': major
'@h3ravel/router': major
'@h3ravel/cache': minor
'@h3ravel/console': minor
'@h3ravel/database': minor
'@h3ravel/http': minor
'@h3ravel/mail': minor
'@h3ravel/queue': minor
'@h3ravel/shared': minor
'@h3ravel/support': minor
---

feat: make service providers sortable and unique while only loading the core providers by default.
Service providers are no longer loaded by default, asides the ones provided by @h3ravel/core
Service provides are sorted by an optional order and priority property.
