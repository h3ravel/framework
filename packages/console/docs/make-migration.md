# Make Migration Command

The `musket make:migration` command generates database migration files for your H3ravel application. Migrations provide version control for your database schema, allowing you to modify and share the database structure with your team.

## Usage

```bash
# Create a basic migration
npx musket make:migration create_users_table

# Create a migration for a new table
npx musket make:migration create_posts_table --create=posts

# Create a migration to modify an existing table
npx musket make:migration add_email_to_users_table --table=users

# Create JavaScript migration instead of TypeScript
npx musket make:migration create_orders_table --type=js
```

## Command Options

| Option | Shortcut | Description |
|--------|----------|-------------|
| `--create` | `-c` | Specify the table to be created |
| `--table` | `-t` | Specify the table to be modified |
| `--type` | `-l` | File type to generate (ts or js, default: ts) |

## Migration Naming Conventions

### File Naming Rules

Migration files follow a specific naming pattern:

```
{timestamp}_{migration_name}.ts
```

**Timestamp Format:** `YYYY_MM_DD_HHmmss`

**Examples:**
```
2024_01_15_143022_create_users_table.ts
2024_01_15_143045_add_email_to_users_table.ts
2024_01_15_143102_create_posts_table.ts
```

### Migration Name Patterns

H3ravel automatically detects the migration type and table name from the migration name:

#### Create Table Patterns

```bash
# Pattern: create_{table}_table
npx musket make:migration create_users_table
# → Creates migration for 'users' table

# Pattern: create_{table}
npx musket make:migration create_posts
# → Creates migration for 'posts' table
```

#### Modify Table Patterns

```bash
# Pattern: {action}_to_{table}_table
npx musket make:migration add_status_to_users_table
# → Modifies 'users' table

# Pattern: {action}_from_{table}_table
npx musket make:migration remove_age_from_users_table
# → Modifies 'users' table

# Pattern: {action}_in_{table}_table
npx musket make:migration update_role_in_users_table
# → Modifies 'users' table
```

### Naming Best Practices

```bash
# Good naming - descriptive and clear
npx musket make:migration create_users_table
npx musket make:migration add_avatar_to_users_table
npx musket make:migration create_order_items_table
npx musket make:migration remove_deprecated_columns_from_products_table

# Avoid - unclear or generic
npx musket make:migration update_table
npx musket make:migration fix_users
npx musket make:migration migration1
```

## Output Directory

Migrations are created in the `database/migrations/` directory:

```
src/database/migrations/
├── 2024_01_15_143022_create_users_table.ts
├── 2024_01_15_143045_add_email_to_users_table.ts
└── 2024_01_15_143102_create_posts_table.ts
```

The directory is automatically created if it doesn't exist.

## Generated Migration Files

### Basic Migration (No Table Specified)

When no table is specified, a blank migration is generated:

```bash
npx musket make:migration update_database_structure
```

**Generated file:**
```typescript
// database/migrations/2024_01_15_143022_update_database_structure.ts
import { Migration } from '@h3ravel/arquebus'
import { SchemaBuilder } from '@h3ravel/arquebus/types/query-builder'

export default class extends Migration {
  /**
    * Run the migrations.
    */
  async up (schema: SchemaBuilder) {
    //
  }

  /**
    * Reverse the migrations.
    */
  async down (schema: SchemaBuilder) {
    //
  }
}
```

### Create Table Migration

When creating a new table:

```bash
npx musket make:migration create_users_table --create=users
# Or let H3ravel guess the table name:
npx musket make:migration create_users_table
```

**Generated file:**
```typescript
// database/migrations/2024_01_15_143022_create_users_table.ts
import { Migration } from '@h3ravel/arquebus'
import { SchemaBuilder } from '@h3ravel/arquebus/types/query-builder'

export default class extends Migration {
  /**
    * Run the migrations.
    */
  async up(schema: SchemaBuilder) {
    await schema.createTable('users', (table) => {
      table.increments('id')
      table.timestamps()
    })
  }

  /**
    * Reverse the migrations.
    */
  async down(schema: SchemaBuilder) {
    await schema.dropTableIfExists('users')
  }
}
```

### Modify Table Migration

When modifying an existing table:

```bash
npx musket make:migration add_email_to_users_table --table=users
# Or let H3ravel guess:
npx musket make:migration add_email_to_users_table
```

**Generated file:**
```typescript
// database/migrations/2024_01_15_143022_add_email_to_users_table.ts
import { Migration } from '@h3ravel/arquebus'
import { SchemaBuilder } from '@h3ravel/arquebus/types/query-builder'

export default class extends Migration {
  /**
    * Run the migrations.
    */
  async up(schema: SchemaBuilder) {
    await schema.table('users', (table) => {
      // Add your column modifications here
    })
  }

  /**
    * Reverse the migrations.
    */
  async down(schema: SchemaBuilder) {
    await schema.table('users', (table) => {
      // Reverse your column modifications here
    })
  }
}
```

## Table Name Detection

H3ravel uses the `TableGuesser` utility to automatically detect table names from migration names.

### Create Table Detection

Patterns recognized for **creating** tables:
- `create_{table}_table` → table name: `{table}`
- `create_{table}` → table name: `{table}`

```bash
npx musket make:migration create_users_table
# Detected: table = 'users', type = 'create'

npx musket make:migration create_posts
# Detected: table = 'posts', type = 'create'
```

### Modify Table Detection

Patterns recognized for **modifying** tables:
- `{action}_to_{table}_table` → table name: `{table}`
- `{action}_from_{table}_table` → table name: `{table}`
- `{action}_in_{table}_table` → table name: `{table}`
- `{action}_to_{table}` → table name: `{table}`
- `{action}_from_{table}` → table name: `{table}`
- `{action}_in_{table}` → table name: `{table}`

```bash
npx musket make:migration add_email_to_users_table
# Detected: table = 'users', type = 'modify'

npx musket make:migration remove_age_from_profiles_table
# Detected: table = 'profiles', type = 'modify'

npx musket make:migration update_status_in_orders_table
# Detected: table = 'orders', type = 'modify'
```

### Manual Table Specification

You can always override automatic detection:

```bash
# Force create table
npx musket make:migration setup_user_permissions --create=permissions

# Force modify table
npx musket make:migration update_schema --table=users
```

## Typical Migration Examples

### Creating a Users Table

```bash
npx musket make:migration create_users_table
```

Edit the generated file:
```typescript
async up(schema: SchemaBuilder) {
  await schema.createTable('users', (table) => {
    table.increments('id')
    table.string('name')
    table.string('email').unique()
    table.string('password')
    table.timestamp('email_verified_at').nullable()
    table.string('remember_token', 100).nullable()
    table.timestamps()
  })
}

async down(schema: SchemaBuilder) {
  await schema.dropTableIfExists('users')
}
```

### Adding a Column

```bash
npx musket make:migration add_avatar_to_users_table
```

Edit the generated file:
```typescript
async up(schema: SchemaBuilder) {
  await schema.table('users', (table) => {
    table.string('avatar').nullable().after('email')
  })
}

async down(schema: SchemaBuilder) {
  await schema.table('users', (table) => {
    table.dropColumn('avatar')
  })
}
```

### Creating a Posts Table with Foreign Key

```bash
npx musket make:migration create_posts_table
```

Edit the generated file:
```typescript
async up(schema: SchemaBuilder) {
  await schema.createTable('posts', (table) => {
    table.increments('id')
    table.integer('user_id').unsigned()
    table.string('title')
    table.text('content')
    table.enum('status', ['draft', 'published']).defaultTo('draft')
    table.timestamps()
    
    // Foreign key constraint
    table.foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
  })
}

async down(schema: SchemaBuilder) {
  await schema.dropTableIfExists('posts')
}
```

### Modifying Multiple Columns

```bash
npx musket make:migration update_users_table_structure
```

Edit the generated file:
```typescript
async up(schema: SchemaBuilder) {
  await schema.table('users', (table) => {
    table.string('phone', 20).nullable()
    table.boolean('is_active').defaultTo(true)
    table.dropColumn('old_field')
    table.renameColumn('name', 'full_name')
  })
}

async down(schema: SchemaBuilder) {
  await schema.table('users', (table) => {
    table.dropColumn('phone')
    table.dropColumn('is_active')
    table.string('old_field').nullable()
    table.renameColumn('full_name', 'name')
  })
}
```

### Creating a Pivot Table

```bash
npx musket make:migration create_role_user_table
```

Edit the generated file:
```typescript
async up(schema: SchemaBuilder) {
  await schema.createTable('role_user', (table) => {
    table.integer('user_id').unsigned()
    table.integer('role_id').unsigned()
    table.timestamps()
    
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
    table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE')
    
    table.primary(['user_id', 'role_id'])
  })
}

async down(schema: SchemaBuilder) {
  await schema.dropTableIfExists('role_user')
}
```

## Integration with Arquebus ORM

### Schema Builder Methods

H3ravel's migration system uses Arquebus ORM, which is built on Knex.js. Available schema methods:

#### Table Operations
```typescript
// Create table
await schema.createTable('users', (table) => { ... })

// Modify table
await schema.table('users', (table) => { ... })

// Drop table
await schema.dropTable('users')
await schema.dropTableIfExists('users')

// Rename table
await schema.renameTable('old_name', 'new_name')

// Check if table exists
const exists = await schema.hasTable('users')
```

#### Column Types
```typescript
table.increments('id')                    // Auto-incrementing ID
table.integer('age')                      // Integer
table.bigInteger('views')                 // Big integer
table.string('name', 255)                 // VARCHAR
table.text('description')                 // TEXT
table.boolean('is_active')                // Boolean
table.date('birth_date')                  // Date
table.datetime('created_at')              // Datetime
table.timestamp('updated_at')             // Timestamp
table.timestamps()                        // created_at & updated_at
table.decimal('price', 8, 2)             // Decimal
table.float('rating')                     // Float
table.json('metadata')                    // JSON
table.uuid('identifier')                  // UUID
table.enum('status', ['active', 'inactive']) // Enum
```

#### Column Modifiers
```typescript
table.string('email').nullable()          // Allow null
table.string('email').notNullable()       // Disallow null
table.string('email').unique()            // Add unique constraint
table.string('email').defaultTo('default') // Set default value
table.string('email').unsigned()          // Unsigned (numbers)
table.string('bio').after('email')        // Position after column
table.string('email').index()             // Add index
table.string('email').comment('User email') // Add comment
```

#### Indexes and Keys
```typescript
table.primary(['id'])                     // Primary key
table.unique(['email'])                   // Unique index
table.index(['name'])                     // Regular index
table.foreign('user_id')                  // Foreign key
  .references('id')
  .inTable('users')
  .onDelete('CASCADE')
  .onUpdate('RESTRICT')
```

#### Column Operations
```typescript
table.dropColumn('column_name')           // Drop column
table.renameColumn('old', 'new')          // Rename column
table.dropForeign('column_name')          // Drop foreign key
table.dropUnique(['email'])               // Drop unique constraint
table.dropIndex(['name'])                 // Drop index
```

### Running Migrations

After creating migrations, run them:

```bash
# Run all pending migrations
npx musket migrate:run

# Rollback last batch
npx musket migrate:rollback

# Reset all migrations
npx musket migrate:reset

# Refresh (reset + re-run)
npx musket migrate:refresh

# Drop all tables and re-run
npx musket migrate:fresh

# Show migration status
npx musket migrate:status
```

## Best Practices

### 1. Descriptive Names

Use clear, descriptive names that explain what the migration does:

```bash
# Clear purpose
npx musket make:migration create_users_table
npx musket make:migration add_two_factor_auth_to_users_table
npx musket make:migration create_product_categories_table

# Unclear purpose
npx musket make:migration update_users
npx musket make:migration fix_bug
npx musket make:migration temp_migration
```

### 2. One Change Per Migration

Keep migrations focused on a single logical change:

```bash
# Single purpose
npx musket make:migration add_avatar_to_users_table
npx musket make:migration add_bio_to_users_table

# Multiple unrelated changes
npx musket make:migration update_users_and_posts_and_comments
```

### 3. Reversible Migrations

Always implement the `down` method to reverse changes:

```typescript
// Properly reversible
async up(schema: SchemaBuilder) {
  await schema.table('users', (table) => {
    table.string('phone')
  })
}

async down(schema: SchemaBuilder) {
  await schema.table('users', (table) => {
    table.dropColumn('phone')
  })
}

// Not reversible
async down(schema: SchemaBuilder) {
  // Empty - cannot rollback!
}
```

### 4. Data Integrity

Always consider data integrity with foreign keys and constraints:

```typescript
async up(schema: SchemaBuilder) {
  await schema.createTable('posts', (table) => {
    table.increments('id')
    table.integer('user_id').unsigned().notNullable()
    table.string('title').notNullable()
    
    // Ensure referential integrity
    table.foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
  })
}
```

### 5. Default Values

Provide sensible defaults for new columns:

```typescript
async up(schema: SchemaBuilder) {
  await schema.table('users', (table) => {
    table.boolean('is_active').defaultTo(true)
    table.integer('login_count').defaultTo(0)
  })
}
```

## Common Patterns

### Soft Deletes

```bash
npx musket make:migration add_soft_deletes_to_users_table
```

```typescript
async up(schema: SchemaBuilder) {
  await schema.table('users', (table) => {
    table.timestamp('deleted_at').nullable()
  })
}

async down(schema: SchemaBuilder) {
  await schema.table('users', (table) => {
    table.dropColumn('deleted_at')
  })
}
```

### Polymorphic Relationships

```bash
npx musket make:migration create_comments_table
```

```typescript
async up(schema: SchemaBuilder) {
  await schema.createTable('comments', (table) => {
    table.increments('id')
    table.text('content')
    table.integer('commentable_id').unsigned()
    table.string('commentable_type')
    table.timestamps()
    
    table.index(['commentable_id', 'commentable_type'])
  })
}
```

### UUID Primary Keys

```bash
npx musket make:migration create_sessions_table
```

```typescript
async up(schema: SchemaBuilder) {
  await schema.createTable('sessions', (table) => {
    table.uuid('id').primary()
    table.integer('user_id').unsigned()
    table.text('payload')
    table.integer('last_activity')
  })
}
```

## Troubleshooting

### Migration Already Exists

```bash
ERROR: Migration file already exists
```

**Solution:** Choose a different name or wait a second for a new timestamp.

### Table Not Found

If automatic detection fails, explicitly specify the table:

```bash
npx musket make:migration custom_migration --table=users
```

### JavaScript vs TypeScript

Generate JavaScript migrations when needed:

```bash
npx musket make:migration create_users_table --type=js
```

## Development Workflow

```bash
# 1. Create migration
npx musket make:migration create_products_table

# 2. Edit the migration file
# Add your schema definition

# 3. Run the migration
npx musket migrate:run

# 4. If issues occur, rollback
npx musket migrate:rollback

# 5. Fix and re-run
npx musket migrate:run
```

The `make:migration` command is fundamental to H3ravel's database version control system, providing a structured way to evolve your database schema over time while maintaining the ability to rollback changes when needed.