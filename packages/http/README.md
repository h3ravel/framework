<div align="center">
  <a href="https://h3ravel.toneflix.net"  target="_blank">
    <img src="https://raw.githubusercontent.com/h3ravel/assets/refs/heads/main/logo-full.svg" width="200" alt="H3ravel Logo">
  </a>
  <h1 align="center"><a href="https://h3ravel.toneflix.net/arquebus">H3ravel HTTP</a></h1>

[![Framework][ix]][lx]
[![Http Package Version][i1]][l1]
[![Downloads][d1]][d1]
[![Tests][tei]][tel]
[![License][lini]][linl]

</div>

# About H3ravel/http

This is the middleware pipeline and HTTP kernel system for the [H3ravel](https://h3ravel.toneflix.net) framework.

## API Resources

H3ravel provides `Resource` and `Collection` classes to standardize JSON API responses.

### Single Resource

```ts
import { Resource } from '@h3ravel/http'

const user = { id: 1, name: 'Alice' }
const userResource = new Resource(user)

console.log(userResource.toArray())
// Output: { id: 1, name: 'Alice' }
```

### Resource with Relationships

```ts
const user = { id: 1, name: 'Alice', posts: [{ id: 10, title: 'Hello' }] }
const userResource = new Resource(user).withRelation('posts', user.posts)

console.log(userResource.toArray())
// Output: { id: 1, name: 'Alice', posts: [{ id: 10, title: 'Hello' }] }
```

### Collection of Resources

```ts
import { Collection, Resource } from '@h3ravel/http'

const users = [new Resource({ id: 1 }), new Resource({ id: 2 })]
const collection = new Collection(users)
    .withPagination({ from: 1, to: 2, total: 10, perPage: 2 })
    .withLinks({ self: '/users', next: '/users?page=2' })

console.log(collection.toArray())
// Output: [{ id: 1 }, { id: 2 }]

console.log(collection.json())
/* Output:
{
  data: [{ id: 1 }, { id: 2 }],
  meta: { pagination: { from: 1, to: 2, total: 10, perPage: 2 } },
  links: { self: '/users', next: '/users?page=2' }
}
*/
```

### JsonResource (HTTP Response)

```ts
import { JsonResource } from '@h3ravel/http'

const jsonRes = new JsonResource({ req: {}, res: { status: 200 } } as any, collection).json()

console.log(jsonRes.body)
/* Output:
{
  data: [{ id: 1 }, { id: 2 }],
  meta: { pagination: { from: 1, to: 2, total: 10, perPage: 2 } },
  links: { self: '/users', next: '/users?page=2' }
}
*/
```

### Additional Features

You can add extra fields to the JSON response with additional():

```ts
jsonRes.additional({ message: 'Fetched successfully' })
console.log(jsonRes.body)
/* Output:
{
  data: [{ id: 1 }, { id: 2 }],
  meta: { pagination: { from: 1, to: 2, total: 10, perPage: 2 } },
  links: { self: '/users', next: '/users?page=2' },
  message: 'Fetched successfully'
}
*/
```

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
[i1]: https://img.shields.io/npm/v/%40h3ravel%2Fhttp?style=flat-square&label=@h3ravel/http&color=%230970ce
[l1]: https://www.npmjs.com/package/@h3ravel/http
[d1]: https://img.shields.io/npm/dt/%40h3ravel%2Fhttp?style=flat-square&label=Downloads&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40h3ravel%2Fhttp
[linl]: https://github.com/h3ravel/framework/blob/main/LICENSE
[lini]: https://img.shields.io/github/license/h3ravel/framework
[tel]: https://github.com/h3ravel/framework/actions/workflows/test.yml
[tei]: https://github.com/h3ravel/framework/actions/workflows/test.yml/badge.svg
