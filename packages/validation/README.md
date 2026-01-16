<div align="center">
  <a href="https://h3ravel.toneflix.net"  target="_blank">
    <img src="https://raw.githubusercontent.com/h3ravel/assets/refs/heads/main/logo-full.svg" width="200" alt="H3ravel Logo">
  </a>
  <h1 align="center"><a href="https://h3ravel.toneflix.net/guide/validation">H3ravel Validation</a></h1>

[![Framework][ix]][lx]
[![Validation Package Version][i1]][l1]
[![Downloads][d1]][l1]
[![Tests][tei]][tel]
[![License][lini]][linl]

</div>

# About H3ravel/validation

Lightweight validation library providing expressive rule-based validation for requests, data objects, and custom logic for [H3ravel](https://h3ravel.toneflix.net) applications.

## Installation

```bash
npm install @h3ravel/validation
```

## Features

- Rule-based validation — Supports common rules like required, min, max, email, url, numeric, boolean, in, regex, etc.
- Nested data validation — Dot notation for nested objects (user.email, items.\*.price).
- Custom error messages — Per-rule and per-field message overrides.
- Batch validation — Validate multiple datasets or groups in one call.
- Conditional validation — Rules that only apply when other fields meet conditions (required_if, sometimes, exclude_unless).
- Implicit rules — Rules that run even when attributes are missing (e.g., accepted, required).

- Custom rules — Define user-provided validation rules as functions or classes.
- Async rules — Support for async validation (e.g., checking uniqueness in a database).
- Attribute sanitization — Optional transformation (e.g., trimming, normalizing case) before validation.
- Dynamic rule sets — Rules can be generated at runtime (e.g., based on user roles).
- Dependent rules — Rules that reference other fields dynamically.

- Localized error messages — Built-in support for localization and i18n message templates.
- Structured errors — Validation errors returned as structured objects or flat key–message pairs.
- Fail-fast mode — Option to stop at the first failure or collect all errors.
- Human-readable summaries — Helper for formatting readable validation reports.

- TypeScript-first design — Full type inference for rules, messages, and validated data.
- Chainable API — Optional fluent syntax for building validators.

## Usage

## Contributing

Thank you for considering contributing to the H3ravel framework! The [Contribution Guide](https://h3ravel.toneflix.net/contributing) can be found in the H3ravel documentation and will provide you with all the information you need to get started.

## Code of Conduct

In order to ensure that the H3ravel community is welcoming to all, please review and abide by the [Code of Conduct](#).

## Security Vulnerabilities

If you discover a security vulnerability within H3ravel, please send an e-mail to Legacy via hamzas.legacy@toneflix.ng. All security vulnerabilities will be promptly addressed.

## License

The H3ravel framework is open-sourced software licensed under the [MIT license](LICENSE).

[ix]: https://img.shields.io/npm/v/%40h3ravel%2Fcore?style=flat-square&label=Framework&color=%230970ce
[lx]: https://www.npmjs.com/package/@h3ravel/core
[i1]: https://img.shields.io/npm/v/%40h3ravel%2Fvalidation?style=flat-square&label=@h3ravel/validation&color=%230970ce
[l1]: https://www.npmjs.com/package/@h3ravel/validation
[d1]: https://img.shields.io/npm/dt/%40h3ravel%2Fvalidation?style=flat-square&label=Downloads&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40h3ravel%2Fvalidation
[linl]: https://github.com/h3ravel/framework/blob/main/LICENSE
[lini]: https://img.shields.io/github/license/h3ravel/framework
[tel]: https://github.com/h3ravel/framework/actions/workflows/test.yml
[tei]: https://github.com/h3ravel/framework/actions/workflows/test.yml/badge.svg
