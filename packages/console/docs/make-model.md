# Make Model Command

The `musket make:model` command scaffolds a new Arquebus model class in your H3ravel application. Models represent database tables and provide an elegant interface for interacting with your data.

## Usage

```bash
# Create a basic model
npx musket make:model User

# Create model with migration
npx musket make:model Post --migration

# Create model with controller
npx musket make:model Product --controller

# Create model with everything (migration, controller, factory, seeder)
npx musket make:model Order --all

# Force create (overwrite existing)
npx musket make:model User --force
```

## Command Options

| Option | Shortcut | Description |
|--------|----------|-------------|
| `--migration` | `-m` | Create a migration file for the model |
| `--controller` | `-c` | Create a controller for the model |
| `--factory` | `-f` | Create a factory for the model |
| `--seeder` | `-s` | Create a seeder for the model |
| `--resource` | `-r` | Generate a resource controller (requires --controller) |
| `--api` | - | Generate an API resource controller (requires --controller) |
| `--all` | `-a` | Generate migration, seeder, factory, and resource controller |
| `--type` | `-t` | File type to generate (ts or js, default: ts) |
| `--force` | - | Create the model even if it already exists |

## Model Naming Conventions

### Class Names
- Use **PascalCase** for model names
- Use singular form (User, not Users)
- Model class names should be descriptive and meaningful

```bash
# ✅ Good naming
npx musket make:model User
npx musket make:model BlogPost  
npx musket make:model OrderItem

# ❌ Avoid
npx musket make:model users      # Should be singular
npx musket make:model user       # Should be PascalCase
npx musket make:model Data       # Too generic
```

### File Names
- Files are automatically created in **lowercase**
- Located in `src/app/Models/` directory
- Follow the pattern: `{modelname}.ts` or `{modelname}.js`

```
User model → src/app/Models/user.ts
BlogPost model → src/app/Models/blogpost.ts
OrderItem model → src/app/Models/orderitem.ts
```

### Directory Structure
```
src/app/Models/
├── user.ts
├── post.ts
├── order.ts
└── Category/
    ├── subcategory.ts
    └── tag.ts
```

## Generated Model File

### Basic Model Structure

When you run `npx musket make:model User`, the generated file looks like:

```typescript
// src/app/Models/user.ts
import { Model } from '@h3ravel/database'

export default class User extends Model {
  //
}
```

### Complete Model Example

Here's what a fully developed model might look like:

```typescript
// src/app/Models/user.ts
import { Model } from '@h3ravel/database'

export default class User extends Model {
    /**
     * The table associated with the model.
     */
    protected table: string = 'users'
    
    /**
     * The attributes that are mass assignable.
     */
    protected fillable: string[] = [
        'name',
        'email',
        'password'
    ]
    
    /**
     * The attributes that should be hidden from arrays.
     */
    protected hidden: string[] = [
        'password',
        'remember_token'
    ]
    
    /**
     * The attributes that should be cast to native types.
     */
    protected casts: Record<string, string> = {
        'email_verified_at': 'datetime',
        'created_at': 'datetime',
        'updated_at': 'datetime'
    }

    /**
     * Define relationship with posts
     */
    public posts() {
        return this.hasMany(Post, 'user_id')
    }
    
    /**
     * Define relationship with profile
     */
    public profile() {
        return this.hasOne(Profile, 'user_id')
    }
}
```

## Examples

### Basic Model Creation

```bash
# Create a simple User model
npx musket make:model User
```

**Output:**
```
INFO: User Model Created user.ts
```

**Generated file:** `src/app/Models/user.ts`

### Model with Migration

```bash
# Create model and corresponding migration
npx musket make:model Post --migration
```

**Creates:**
- `src/app/Models/post.ts` - The model file
- `database/migrations/2024_01_15_143022_create_posts_table.ts` - Migration file

### Model with Controller

```bash
# Create model with a resource controller
npx musket make:model Product --controller --resource
```

**Creates:**
- `src/app/Models/product.ts` - The model file  
- `src/app/Http/Controllers/ProductController.ts` - Resource controller

### Complete Resource Generation

```bash
# Create everything at once
npx musket make:model Order --all
```

**Creates:**
- Model: `src/app/Models/order.ts`
- Migration: `database/migrations/{timestamp}_create_orders_table.ts`
- Controller: `src/app/Http/Controllers/OrderController.ts`
- Factory: `database/factories/OrderFactory.ts` (when available)
- Seeder: `database/seeders/OrderSeeder.ts` (when available)

### Nested Models

```bash
# Create model in subdirectory
npx musket make:model Blog/Post --migration
```

**Creates:**
- `src/app/Models/Blog/post.ts`
- Migration file with appropriate table name

### JavaScript Models

```bash
# Create JavaScript model instead of TypeScript
npx musket make:model User --type=js
```

**Creates:** `src/app/Models/user.js`

## Integration with Migrations

### Automatic Migration Creation

When using the `--migration` flag, H3ravel automatically:

1. **Guesses table name** from model name (User → users)
2. **Creates timestamped migration** file
3. **Sets up basic table structure**

```bash
npx musket make:model Product --migration
```

**Generated migration:**
```typescript
// database/migrations/2024_01_15_143022_create_products_table.ts
import { Migration } from '@h3ravel/database'
import { CreateTableBuilder } from 'knex'

export default class extends Migration {
    public async up(): Promise<void> {
        this.schema.createTable('products', (table: CreateTableBuilder) => {
            table.increments('id')
            table.timestamps()
        })
    }

    public async down(): Promise<void> {
        this.schema.dropTable('products')
    }
}
```

### Custom Table Names

If the automatic table name guessing isn't correct, specify it in your model:

```typescript
export default class BlogPost extends Model {
    protected table: string = 'blog_posts'  // Custom table name
}
```

## Integration with Controllers

### Route Model Binding

Models automatically support route model binding through the `resolveRouteBinding` method:

```typescript
// In your routes
Route.get('/users/:user', [UserController, 'show'])
```

```typescript
// In your controller
export class UserController extends Controller {
    @Injectable()
    async show(ctx: HttpContext, user: User) {
        // user is automatically resolved from route parameter
        return { id: user.id, name: user.name }
    }
}
```

### Controller Generation

When creating models with controllers:

```bash
# API controller
npx musket make:model Post --controller --api

# Resource controller  
npx musket make:model Post --controller --resource
```

**Generated controller methods:**
- `index()` - List all records
- `store()` - Create new record
- `show()` - Display specific record
- `update()` - Update existing record
- `destroy()` - Delete record

## Integration with Factories

### Factory Generation

```bash
# Create model with factory (when available)
npx musket make:model User --factory
```

**Note:** Factory support is planned but not yet implemented in H3ravel. The command will show:
```
Factory support is not yet available
```

### Future Factory Usage

Once implemented, factories will enable:

```typescript
// Create fake data for testing
const user = await User.factory().create()

// Create multiple records
const users = await User.factory().count(10).create()

// Create with specific attributes
const admin = await User.factory().create({ role: 'admin' })
```

## Model Features

### Database Operations

```typescript
// Create
const user = await User.create({
    name: 'John Doe',
    email: 'john@example.com'
})

// Find
const user = await User.find(1)
const user = await User.findOrFail(1)

// Query
const users = await User.where('active', true).get()
const user = await User.where('email', email).first()

// Update
await user.update({ name: 'Jane Doe' })

// Delete
await user.delete()
```

### Relationships

```typescript
// One-to-Many
public posts() {
    return this.hasMany(Post, 'user_id')
}

// Many-to-One
public user() {
    return this.belongsTo(User, 'user_id')
}

// One-to-One
public profile() {
    return this.hasOne(Profile, 'user_id')
}

// Many-to-Many
public roles() {
    return this.belongsToMany(Role, 'user_roles', 'user_id', 'role_id')
}
```

### Attributes and Casting

```typescript
export default class User extends Model {
    protected fillable = ['name', 'email', 'password']
    protected hidden = ['password', 'remember_token']
    protected casts = {
        'email_verified_at': 'datetime',
        'is_active': 'boolean'
    }
}
```

## Best Practices

### Model Organization

```bash
# ✅ Logical grouping
src/app/Models/
├── User/
│   ├── user.ts
│   ├── profile.ts
│   └── preference.ts
├── Blog/
│   ├── post.ts
│   ├── comment.ts
│   └── tag.ts
└── Ecommerce/
    ├── product.ts
    ├── order.ts
    └── payment.ts
```

### Naming Consistency

```typescript
// ✅ Good practices
export default class User extends Model {
    protected table = 'users'           // Plural table name
    protected primaryKey = 'id'         // Clear primary key
    
    // Relationships use descriptive names
    public posts() { return this.hasMany(Post) }
    public profile() { return this.hasOne(Profile) }
}
```

### Migration Coordination

```bash
# Always create migrations with models for new tables
npx musket make:model Product --migration

# For existing tables, create separate migration
npx musket make:migration add_category_to_products_table --table=products
```

### Security Considerations

```typescript
export default class User extends Model {
    // Always define fillable attributes
    protected fillable = [
        'name',
        'email'
        // Don't include sensitive fields like 'password' directly
    ]
    
    // Hide sensitive data from JSON
    protected hidden = [
        'password',
        'remember_token',
        'api_token'
    ]
}
```

## Common Patterns

### Soft Deletes

```typescript
export default class User extends Model {
    protected dates = ['deleted_at']
    
    // Override delete to soft delete
    async delete() {
        return this.update({ deleted_at: new Date() })
    }
}
```

### Timestamps

```typescript
export default class User extends Model {
    // Arquebus handles created_at and updated_at automatically
    protected timestamps = true
    
    protected casts = {
        'created_at': 'datetime',
        'updated_at': 'datetime'
    }
}
```

### Scopes

```typescript
export default class User extends Model {
    // Global scope
    static query() {
        return super.query().where('deleted_at', null)
    }
    
    // Local scope
    static active() {
        return this.where('is_active', true)
    }
}

// Usage
const activeUsers = await User.active().get()
```

## Error Handling

### Common Errors

```bash
# Model already exists
ERROR: User model already exists

# Solution: Use --force flag
npx musket make:model User --force
```

### Troubleshooting

1. **File not created**: Check directory permissions
2. **Import errors**: Verify @h3ravel/database is installed
3. **Database issues**: Ensure proper Arquebus configuration

## Development Workflow

```bash
# 1. Create model with migration
npx musket make:model Product --migration --controller

# 2. Edit the migration file
# database/migrations/{timestamp}_create_products_table.ts

# 3. Run migration
npx musket migrate:run

# 4. Develop your model
# Add relationships, scopes, etc.

# 5. Test with routes and controllers
```

The `make:model` command is essential for rapid application development, providing a solid foundation for your data models with optional generation of related components like migrations and controllers.