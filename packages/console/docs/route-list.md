# Route List Command

The `musket route:list` command displays all registered routes in your H3ravel application, providing a comprehensive overview of your application's routing structure.

## Usage

```bash
# Display all routes
npx musket route:list

# Output as JSON format
npx musket route:list --json

# Reverse the route ordering
npx musket route:list --reverse
npx musket route:list -r
```

## Command Options

| Option | Shortcut | Description |
|--------|----------|-------------|
| `--json` | - | Output the route list in JSON format |
| `--reverse` | `-r` | Reverse the ordering of the routes |

## Output Format

The command displays routes in a clean, tabular format with the following information:

### Table Layout

```
METHOD|ALT    PATH               NAME › CONTROLLER@METHOD
GET|HEAD      /                  › HomeController@index
POST          /users             users.store › UserController@store  
GET|HEAD      /users/:user       users.show › UserController@show
PUT|PATCH     /users/:user       users.update › UserController@update
DELETE        /users/:user       users.destroy › UserController@destroy
GET|HEAD      /hello             hello.route › 
GET|HEAD      /mail              › MailController@send
GET|HEAD      /app               › 
```

### Column Details

1. **METHOD|ALT**: HTTP method with alternative methods
   - `GET|HEAD` - GET requests also accept HEAD
   - `PUT|PATCH` - PUT requests also accept PATCH  
   - `POST`, `DELETE` - Single method only

2. **PATH**: The route URL pattern
   - `/` - Root route
   - `/users` - Simple path
   - `/users/:user` - Path with parameters (shown in yellow)
   - Path segments with parameters are highlighted

3. **NAME › CONTROLLER@METHOD**: Route identification
   - `users.store` - Named route
   - `HomeController@index` - Controller and method
   - `›` - Separator between name and controller
   - Empty if route uses closure/anonymous function

### Color Coding

The command uses color coding to enhance readability:

- **GET methods**: Blue
- **POST methods**: Yellow  
- **PUT methods**: Yellow
- **DELETE methods**: Red
- **HEAD methods**: Gray
- **Route parameters**: Yellow (e.g., `:user`, `:id`)
- **Path separators**: White

## Examples

### Basic Route Listing

```bash
npx musket route:list
```

**Sample Output:**
```
GET|HEAD      /                  › HomeController@index
GET|HEAD      /mail              › MailController@send  
GET|HEAD      /app               › 
GET|HEAD      /users             users.index › UserController@index
POST          /users             users.store › UserController@store
GET|HEAD      /users/:user       users.show › UserController@show
PUT|PATCH     /users/:user       users.update › UserController@update
DELETE        /users/:user       users.destroy › UserController@destroy
GET|HEAD      /hello             hello.route › 
```

### JSON Output

```bash
npx musket route:list --json
```

**Sample Output:**
```json
[
  {
    "method": "get",
    "path": "/",
    "name": null,
    "signature": ["HomeController", "index"]
  },
  {
    "method": "post", 
    "path": "/users",
    "name": "users.store",
    "signature": ["UserController", "store"]
  },
  {
    "method": "get",
    "path": "/users/:user", 
    "name": "users.show",
    "signature": ["UserController", "show"]
  }
]
```

### Reverse Ordering

```bash
npx musket route:list --reverse
```

Routes will be displayed in reverse alphabetical order by path.

## Route Types

### Controller Routes

Routes that point to controller methods:

```typescript
// In routes/web.ts
Route.get('/', [HomeController, 'index'])
Route.post('/users', [UserController, 'store'])
```

**Output:**
```
GET|HEAD      /                  › HomeController@index
POST          /users             › UserController@store
```

### Named Routes

Routes with explicit names for URL generation:

```typescript
// In routes/api.ts
Route.get('/hello', () => 'Hello', 'hello.route')
```

**Output:**
```
GET|HEAD      /hello             hello.route › 
```

### Closure Routes

Anonymous function routes:

```typescript
// In routes/web.ts  
Route.get('/app', async function () {
    return await view('index', { /* data */ })
})
```

**Output:**
```
GET|HEAD      /app               › 
```

### Resource Routes

API resource routes (generated via `apiResource`):

```typescript
// In routes/api.ts
Route.apiResource('/users', UserController)
```

**Output:**
```
GET|HEAD      /users             users.index › UserController@index
POST          /users             users.store › UserController@store  
GET|HEAD      /users/:user       users.show › UserController@show
PUT|PATCH     /users/:user       users.update › UserController@update
DELETE        /users/:user       users.destroy › UserController@destroy
```

### Grouped Routes

Routes defined within route groups:

```typescript
// In routes/api.ts
Route.group({
    prefix: '/admin',
    middleware: [AuthMiddleware]
}, () => {
    Route.get('/dashboard', [AdminController, 'dashboard'])
    Route.apiResource('/users', AdminUserController)
})
```

**Output:**
```
GET|HEAD      /admin/dashboard         › AdminController@dashboard
GET|HEAD      /admin/users             admin.users.index › AdminUserController@index
POST          /admin/users             admin.users.store › AdminUserController@store
```

## Integration with Controllers

### Controller Method Resolution

The route list shows how routes connect to controller methods:

1. **Class Name**: The controller class (e.g., `UserController`)
2. **Method Name**: The method to be called (e.g., `index`, `store`, `show`)
3. **Route Model Binding**: Parameters like `:user` automatically resolve to model instances

### Controller Dependencies

Controllers can use dependency injection:

```typescript
export class UserController {
    constructor(private app: Application) {}
    
    async show(ctx: HttpContext, user: User) {
        // :user parameter automatically resolved to User model
        return user
    }
}
```

The route list will show: `users.show › UserController@show`

### Middleware Integration

Routes can have middleware applied:

```typescript
Route.group({
    middleware: [AuthMiddleware]
}, () => {
    Route.apiResource('/users', UserController, [new AuthMiddleware()])
})
```

While middleware isn't shown in the route list output, it's applied during route resolution.

## Route Filtering

### Default Filtering

The command automatically filters out certain HTTP methods:

- **HEAD routes**: Not displayed separately (shown as `GET|HEAD`)
- **PATCH routes**: Not displayed separately (shown as `PUT|PATCH`)

This reduces clutter while showing all available methods for each route.

### Path Ordering

Routes are sorted alphabetically by path with special handling:

1. **Root route (`/`)**: Always appears first
2. **Other routes**: Sorted alphabetically
3. **Parameter routes**: Parameters highlighted in yellow

## Practical Usage

### Development Workflow

```bash
# Check all available routes
npx musket route:list

# Find specific route patterns
npx musket route:list | grep users

# Export routes for documentation  
npx musket route:list --json > routes.json
```

### Debugging Routes

When routes aren't working as expected:

1. **Verify route registration**: Check if route appears in the list
2. **Check method matching**: Ensure HTTP method is correct
3. **Validate path patterns**: Confirm parameter syntax
4. **Controller resolution**: Verify controller and method names

### API Documentation

Use the JSON output to generate API documentation:

```bash
# Generate route data for documentation tools
npx musket route:list --json | jq '.[] | select(.method == "get")'
```

## Common Route Patterns

### RESTful Resources

```typescript
Route.apiResource('/users', UserController)
```

Generates standard REST routes:
- `GET /users` - List all users
- `POST /users` - Create new user  
- `GET /users/:user` - Show specific user
- `PUT /users/:user` - Update user
- `DELETE /users/:user` - Delete user

### Nested Resources

```typescript
Route.apiResource('/users/:user/posts', PostController)
```

Creates nested resource routes:
- `GET /users/:user/posts` - User's posts
- `POST /users/:user/posts` - Create post for user

### Custom Actions

```typescript
Route.post('/users/:user/activate', [UserController, 'activate'])
Route.post('/users/:user/deactivate', [UserController, 'deactivate'])
```

## Best Practices

### Route Organization

1. **Logical grouping**: Use route groups for related functionality
2. **Consistent naming**: Follow RESTful conventions for resource routes  
3. **Meaningful names**: Provide descriptive route names for URL generation

### Performance Considerations

1. **Route ordering**: More specific routes should come before generic ones
2. **Parameter validation**: Use middleware for parameter validation
3. **Caching**: Consider route caching for large applications

The `route:list` command is an essential tool for understanding and debugging your H3ravel application's routing structure, providing clear visibility into how URLs map to your application logic.