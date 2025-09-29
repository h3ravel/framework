# Make Factory Command

The `musket make:factory` command generates model factory classes for creating test data and seeding your database with realistic dummy data in your H3ravel application using Arquebus ORM.

## Usage

```bash
# Generate a factory for a model
npx musket make:factory UserFactory

# Generate a factory with a specific model association
npx musket make:factory PostFactory --model=Post

# Generate a factory in a custom subdirectory
npx musket make:factory Admin/UserFactory
```

## Command Options

| Option | Description |
|--------|-------------|
| `--model=` | The name of the model the factory is for |
| `--force` | Overwrite the factory if it already exists |

## Generated File Structure

The command creates a new file at `database/factories/{FactoryName}.ts`:

```typescript
import { Factory } from '@h3ravel/arquebus';
import { User } from '../../app/Models/User';

export class UserFactory extends Factory<User> {
    /**
     * The name of the factory's corresponding model.
     */
    protected model = User;

    /**
     * Define the model's default state.
     */
    public definition(): Partial<User> {
        return {
            name: this.faker.person.fullName(),
            email: this.faker.internet.email(),
            password: 'password',
        };
    }
}
```

## What are Factories?

Factories are classes that define how to generate fake data for your models. They are essential for:

- **Testing**: Create realistic test data for verifying application behavior
- **Development**: Quickly populate your database with sample data
- **Seeding**: Generate initial or demo data for your application
- **Demonstrations**: Create sample data for showcasing features

Factories integrate seamlessly with Arquebus ORM entities, allowing you to generate model instances with predefined or randomized attributes using the Faker library.

## Creating Factories

### Basic Factory Creation

To create a new factory:

```bash
npx musket make:factory UserFactory
```

**Generated File Location:**
```
database/factories/UserFactory.ts
```

**Generated Content:**
```typescript
import { Factory } from '@h3ravel/arquebus';
import { User } from '../../app/Models/User';

export class UserFactory extends Factory<User> {
    protected model = User;

    public definition(): Partial<User> {
        return {
            name: this.faker.person.fullName(),
            email: this.faker.internet.email(),
            password: 'password',
        };
    }
}
```

### Specifying the Model

Explicitly specify which model the factory is for:

```bash
npx musket make:factory PostFactory --model=Post
```

**Generated Content:**
```typescript
import { Factory } from '@h3ravel/arquebus';
import { Post } from '../../app/Models/Post';

export class PostFactory extends Factory<Post> {
    protected model = Post;

    public definition(): Partial<Post> {
        return {
            title: this.faker.lorem.sentence(),
            content: this.faker.lorem.paragraphs(3),
            published: false,
        };
    }
}
```

### Organizing in Subdirectories

Create factories in subdirectories for better organization:

```bash
npx musket make:factory Blog/PostFactory --model=Post
npx musket make:factory Admin/UserFactory --model=User
```

**Directory Structure:**
```
database/factories/
├── UserFactory.ts
├── Blog/
│   └── PostFactory.ts
└── Admin/
    └── AdminUserFactory.ts
```

### Force Overwrite

Overwrite an existing factory:

```bash
npx musket make:factory UserFactory --force
```

## Factory Definition

### Basic Attributes

The `definition` method returns default values for model attributes:

```typescript
export class UserFactory extends Factory<User> {
    protected model = User;

    public definition(): Partial<User> {
        return {
            name: this.faker.person.fullName(),
            email: this.faker.internet.email(),
            emailVerifiedAt: new Date(),
            password: 'password',
            rememberToken: this.faker.string.alphanumeric(10),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
}
```

### Using Faker Library

Factories provide access to `this.faker` for generating realistic fake data:

```typescript
public definition(): Partial<User> {
    return {
        // Personal information
        name: this.faker.person.fullName(),
        firstName: this.faker.person.firstName(),
        lastName: this.faker.person.lastName(),
        
        // Contact information
        email: this.faker.internet.email(),
        phone: this.faker.phone.number(),
        
        // Address information
        street: this.faker.location.streetAddress(),
        city: this.faker.location.city(),
        state: this.faker.location.state(),
        zipCode: this.faker.location.zipCode(),
        country: this.faker.location.country(),
        
        // Text content
        bio: this.faker.lorem.paragraph(),
        description: this.faker.lorem.sentences(2),
        
        // Numbers and dates
        age: this.faker.number.int({ min: 18, max: 80 }),
        salary: this.faker.number.int({ min: 30000, max: 150000 }),
        birthDate: this.faker.date.birthdate(),
        joinedAt: this.faker.date.past(),
        
        // Internet
        username: this.faker.internet.username(),
        avatar: this.faker.image.avatar(),
        website: this.faker.internet.url(),
        
        // Business
        company: this.faker.company.name(),
        jobTitle: this.faker.person.jobTitle(),
    };
}
```

## Factory States

States define different variations of your model:

```typescript
export class UserFactory extends Factory<User> {
    protected model = User;

    public definition(): Partial<User> {
        return {
            name: this.faker.person.fullName(),
            email: this.faker.internet.email(),
            password: 'password',
            isAdmin: false,
            isActive: true,
        };
    }

    /**
     * Indicate that the user is an administrator.
     */
    public admin(): this {
        return this.state({
            isAdmin: true,
            role: 'admin',
        });
    }

    /**
     * Indicate that the user account is suspended.
     */
    public suspended(): this {
        return this.state({
            isActive: false,
            suspendedAt: new Date(),
        });
    }

    /**
     * Indicate that the user's email is unverified.
     */
    public unverified(): this {
        return this.state({
            emailVerifiedAt: null,
        });
    }
}
```

**Usage:**
```typescript
// Create admin user
const admin = await UserFactory.admin().create();

// Create suspended user
const suspended = await UserFactory.suspended().create();

// Combine multiple states
const unverifiedAdmin = await UserFactory.admin().unverified().create();
```

## Factory Relationships

Define relationships between factories:

```typescript
export class PostFactory extends Factory<Post> {
    protected model = Post;

    public definition(): Partial<Post> {
        return {
            title: this.faker.lorem.sentence(),
            content: this.faker.lorem.paragraphs(3),
            published: false,
        };
    }

    /**
     * Associate the post with a specific user.
     */
    public forUser(user: User): this {
        return this.state({
            userId: user.id,
            user: user,
        });
    }

    /**
     * Create the post as published.
     */
    public published(): this {
        return this.state({
            published: true,
            publishedAt: new Date(),
        });
    }
}
```

**Usage:**
```typescript
const user = await UserFactory.create();
const post = await PostFactory.forUser(user).published().create();
```

## Using Factories

### Creating Single Models

```typescript
import { UserFactory } from '../database/factories/UserFactory';

// Create and save a user
const user = await UserFactory.create();

// Create with custom attributes
const admin = await UserFactory.create({
    name: 'Admin User',
    email: 'admin@example.com',
});

// Create using a state
const suspendedUser = await UserFactory.suspended().create();

// Combine states
const unverifiedAdmin = await UserFactory.admin().unverified().create();
```

### Creating Multiple Models

```typescript
// Create 10 users
const users = await UserFactory.createMany(10);

// Create 5 admin users
const admins = await UserFactory.admin().createMany(5);

// Create with custom attributes
const testUsers = await UserFactory.createMany(3, {
    password: 'test-password',
});
```

### Making Without Persisting

Create model instances without saving to the database:

```typescript
// Create instance without saving
const user = UserFactory.make();

// Make multiple instances
const users = UserFactory.makeMany(5);

// Make with custom attributes
const testUser = UserFactory.make({
    email: 'test@example.com',
});
```

## Advanced Features

### Sequences

Generate sequential values:

```typescript
export class UserFactory extends Factory<User> {
    public definition(): Partial<User> {
        return {
            name: this.faker.person.fullName(),
            email: this.sequence(n => `user${n}@example.com`),
            username: this.sequence(n => `user_${n}`),
        };
    }
}

// Creates: user1@example.com, user2@example.com, user3@example.com...
const users = await UserFactory.createMany(10);
```

### Callbacks

Execute code after creating models:

```typescript
export class UserFactory extends Factory<User> {
    public definition(): Partial<User> {
        return {
            name: this.faker.person.fullName(),
            email: this.faker.internet.email(),
        };
    }

    public afterCreating(callback: (user: User) => Promise<void>): this {
        this.afterCreatingCallback = callback;
        return this;
    }
}

// Usage
const user = await UserFactory
    .afterCreating(async (user) => {
        await sendWelcomeEmail(user);
    })
    .create();
```

### Conditional States

Apply states based on conditions:

```typescript
// Create users with random admin status
const users = await Promise.all(
    Array.from({ length: 10 }, async () => {
        const factory = UserFactory;
        if (Math.random() > 0.8) {
            return factory.admin().create();
        }
        return factory.create();
    })
);
```

## Integration with Arquebus ORM

### Entity Mapping

Factories work directly with Arquebus entities:

```typescript
import { Entity, Property, PrimaryKey } from '@h3ravel/arquebus';

@Entity()
export class User {
    @PrimaryKey()
    id!: number;

    @Property()
    name!: string;

    @Property()
    email!: string;

    @Property()
    password!: string;
}
```

**Corresponding Factory:**
```typescript
export class UserFactory extends Factory<User> {
    protected model = User;

    public definition(): Partial<User> {
        return {
            name: this.faker.person.fullName(),
            email: this.faker.internet.email(),
            password: 'password',
        };
    }
}
```

### Relationship Types

Support for Arquebus relationship decorators:

```typescript
import { Entity, ManyToOne, OneToMany, Collection } from '@h3ravel/arquebus';

@Entity()
export class Post {
    @PrimaryKey()
    id!: number;

    @ManyToOne(() => User)
    user!: User;

    @Property()
    title!: string;

    @OneToMany(() => Comment, comment => comment.post)
    comments = new Collection<Comment>(this);
}
```

**Factory with Relationships:**
```typescript
export class PostFactory extends Factory<Post> {
    protected model = Post;

    public definition(): Partial<Post> {
        return {
            title: this.faker.lorem.sentence(),
            content: this.faker.lorem.paragraphs(3),
        };
    }

    public async withUser(): Promise<this> {
        const user = await UserFactory.create();
        return this.state({ user });
    }

    public async withComments(count: number = 3): Promise<this> {
        const post = await this.create();
        await CommentFactory.forPost(post).createMany(count);
        return this;
    }
}
```

### Entity Manager

Factories use the Arquebus EntityManager for persistence:

```typescript
import { getEntityManager } from '@h3ravel/arquebus';

export class Factory<T> {
    protected async persistModel(model: T): Promise<T> {
        const em = getEntityManager();
        await em.persistAndFlush(model);
        return model;
    }
}
```

## Using Factories in Seeders

### Creating a Seeder

```typescript
import { Seeder } from '@h3ravel/arquebus';
import { UserFactory } from '../factories/UserFactory';
import { PostFactory } from '../factories/PostFactory';

export class DatabaseSeeder extends Seeder {
    public async run(): Promise<void> {
        // Create admin user
        const admin = await UserFactory.admin().create({
            name: 'Admin User',
            email: 'admin@example.com',
        });

        // Create regular users
        const users = await UserFactory.createMany(20);

        // Create posts for each user
        for (const user of users) {
            await PostFactory
                .forUser(user)
                .published()
                .createMany(5);
        }

        this.info('Database seeded successfully!');
    }
}
```

### Running Seeders

```bash
# Run all seeders
npx musket db:seed

# Run specific seeder
npx musket db:seed --class=DatabaseSeeder
```

## Using Factories in Tests

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { UserFactory } from '../../database/factories/UserFactory';

describe('User Model', () => {
    beforeEach(async () => {
        await truncateDatabase();
    });

    it('creates a user successfully', async () => {
        const user = await UserFactory.create();
        
        expect(user.id).toBeDefined();
        expect(user.name).toBeDefined();
        expect(user.email).toContain('@');
    });

    it('creates admin user with proper role', async () => {
        const admin = await UserFactory.admin().create();
        
        expect(admin.isAdmin).toBe(true);
        expect(admin.role).toBe('admin');
    });
});
```

### Integration Tests

```typescript
import { describe, it, expect } from '@jest/globals';
import { UserFactory } from '../../database/factories/UserFactory';
import { PostFactory } from '../../database/factories/PostFactory';

describe('Post Creation', () => {
    it('user can create posts', async () => {
        const user = await UserFactory.create();
        const posts = await PostFactory.forUser(user).createMany(3);

        expect(posts).toHaveLength(3);
        expect(posts[0].userId).toBe(user.id);
    });

    it('published posts are visible', async () => {
        const user = await UserFactory.create();
        
        await PostFactory.forUser(user).createMany(5);
        await PostFactory.forUser(user).published().createMany(3);

        const publishedPosts = await Post.findAll({ published: true });
        expect(publishedPosts).toHaveLength(3);
    });
});
```

### Feature Tests

```typescript
import { test } from '@h3ravel/testing';
import { UserFactory } from '../../database/factories/UserFactory';

test('user registration flow', async ({ client }) => {
    const userData = UserFactory.make();
    
    const response = await client.post('/register', {
        name: userData.name,
        email: userData.email,
        password: 'password',
    });

    expect(response.status).toBe(201);
});

test('authenticated user can access dashboard', async ({ client }) => {
    const user = await UserFactory.create();
    
    const response = await client
        .actingAs(user)
        .get('/dashboard');

    expect(response.status).toBe(200);
});
```

## Factory Examples

### User Factory

```typescript
import { Factory } from '@h3ravel/arquebus';
import { User } from '../../app/Models/User';

export class UserFactory extends Factory<User> {
    protected model = User;

    public definition(): Partial<User> {
        return {
            name: this.faker.person.fullName(),
            email: this.faker.internet.email(),
            password: 'password',
            emailVerifiedAt: new Date(),
            isAdmin: false,
            isActive: true,
            createdAt: new Date(),
        };
    }

    public admin(): this {
        return this.state({
            isAdmin: true,
            role: 'admin',
        });
    }

    public unverified(): this {
        return this.state({
            emailVerifiedAt: null,
        });
    }

    public inactive(): this {
        return this.state({
            isActive: false,
        });
    }
}
```

### Product Factory

```typescript
import { Factory } from '@h3ravel/arquebus';
import { Product } from '../../app/Models/Product';

export class ProductFactory extends Factory<Product> {
    protected model = Product;

    public definition(): Partial<Product> {
        return {
            name: this.faker.commerce.productName(),
            description: this.faker.commerce.productDescription(),
            price: parseFloat(this.faker.commerce.price()),
            sku: this.faker.string.alphanumeric(8).toUpperCase(),
            stock: this.faker.number.int({ min: 0, max: 100 }),
            isAvailable: true,
            category: this.faker.commerce.department(),
        };
    }

    public outOfStock(): this {
        return this.state({
            stock: 0,
            isAvailable: false,
        });
    }

    public onSale(): this {
        return this.state((attributes) => ({
            salePrice: attributes.price * 0.8,
            onSale: true,
        }));
    }
}
```

### Blog Post Factory

```typescript
import { Factory } from '@h3ravel/arquebus';
import { Post } from '../../app/Models/Post';
import { UserFactory } from './UserFactory';

export class PostFactory extends Factory<Post> {
    protected model = Post;

    public definition(): Partial<Post> {
        return {
            title: this.faker.lorem.sentence(),
            slug: this.faker.lorem.slug(),
            content: this.faker.lorem.paragraphs(5),
            excerpt: this.faker.lorem.paragraph(),
            published: false,
            viewCount: 0,
            createdAt: new Date(),
        };
    }

    public async forUser(user?: User): Promise<this> {
        const author = user || await UserFactory.create();
        return this.state({
            userId: author.id,
            user: author,
        });
    }

    public published(): this {
        return this.state({
            published: true,
            publishedAt: new Date(),
        });
    }

    public featured(): this {
        return this.state({
            isFeatured: true,
            featuredAt: new Date(),
        });
    }

    public withViews(count: number): this {
        return this.state({
            viewCount: count,
        });
    }
}
```

## Practical Usage

### Development Workflow

```bash
# Create model and factory together
npx musket make:model Product
npx musket make:factory ProductFactory --model=Product

# Generate test data in development
npx musket db:seed

# Reset and reseed database
npx musket migrate:fresh --seed
```

### Testing Workflow

```bash
# Run tests with factory-generated data
npm test

# Run specific test suite
npm test -- UserFactory.test.ts
```

### Data Generation

```bash
# Seed database with factories
npx musket db:seed

# Seed specific seeder
npx musket db:seed --class=UserSeeder
```

## Best Practices

### Factory Organization

1. **One Factory Per Model**: Each model should have its own dedicated factory
2. **Logical Naming**: Use `ModelNameFactory` convention
3. **Directory Structure**: Organize factories in subdirectories for large applications

```
database/factories/
├── UserFactory.ts
├── Blog/
│   ├── PostFactory.ts
│   └── CommentFactory.ts
├── Shop/
│   ├── ProductFactory.ts
│   └── OrderFactory.ts
└── Admin/
    └── AdminUserFactory.ts
```

### Realistic Data Generation

Generate data that closely resembles production data:

```typescript
public definition(): Partial<User> {
    return {
        // Good: Realistic data
        email: this.faker.internet.email(),
        phone: this.faker.phone.number('###-###-####'),
        
        // Avoid: Unrealistic data
        // email: 'test@test.com',
        // phone: '1234567890',
    };
}
```

### State Methods

Create descriptive state methods for common variations:

```typescript
// Good: Clear, descriptive states
public admin(): this { }
public suspended(): this { }
public verified(): this { }

// Avoid: Vague states
// public special(): this { }
// public modified(): this { }
```

### Relationship Management

Handle relationships explicitly:

```typescript
// Good: Explicit relationship creation
public async withUser(user?: User): Promise<this> {
    const author = user || await UserFactory.create();
    return this.state({ user: author });
}

// Avoid: Implicit relationships in definition
// public definition(): Partial<Post> {
//     return {
//         user: await UserFactory.create(), // Async in sync context
//     };
// }
```

### Performance

1. **Batch Creation**: Use `createMany` instead of multiple `create` calls
2. **Avoid N+1**: Create related models efficiently
3. **Transactions**: Wrap large seeding operations in transactions

```typescript
// Good: Efficient batch creation
const users = await UserFactory.createMany(100);

// Avoid: Multiple individual creates
// for (let i = 0; i < 100; i++) {
//     await UserFactory.create();
// }
```

## Common Patterns

### Creating Test Data Sets

```typescript
// Setup common test data
export async function createTestDataSet() {
    const admin = await UserFactory.admin().create();
    const users = await UserFactory.createMany(10);
    
    for (const user of users) {
        await PostFactory.forUser(user).createMany(3);
    }
    
    return { admin, users };
}
```

### Factory Traits

```typescript
export class UserFactory extends Factory<User> {
    // Base states
    public admin(): this {
        return this.state({ isAdmin: true, role: 'admin' });
    }
    
    // Compound states
    public superAdmin(): this {
        return this.admin().state({ 
            permissions: ['*'],
            canImpersonate: true,
        });
    }
    
    // Contextual states
    public withProfile(): this {
        return this.state({
            bio: this.faker.lorem.paragraph(),
            avatar: this.faker.image.avatar(),
            website: this.faker.internet.url(),
        });
    }
}
```

### Factory Composition

```typescript
export class OrderFactory extends Factory<Order> {
    public async withItems(count: number = 3): Promise<this> {
        const order = await this.create();
        const products = await ProductFactory.createMany(count);
        
        for (const product of products) {
            await OrderItemFactory
                .forOrder(order)
                .forProduct(product)
                .create();
        }
        
        return this;
    }
}
```

## Troubleshooting

### Factory Not Found

If your factory isn't being recognized:

1. **Check Location**: Ensure factory is in `database/factories/` directory
2. **Verify Export**: Confirm factory class is exported
3. **Import Path**: Verify import paths are correct

```typescript
// Correct
export class UserFactory extends Factory<User> { }

// Incorrect
// class UserFactory extends Factory<User> { }
```

### Type Errors

Ensure proper TypeScript types:

```typescript
// Correct
export class UserFactory extends Factory<User> {
    protected model = User;
    
    public definition(): Partial<User> {
        return { /* ... */ };
    }
}

// Incorrect
// export class UserFactory extends Factory {
//     public definition() {
//         return { /* ... */ };
//     }
// }
```

### Faker Method Errors

Use correct Faker syntax:

```typescript
// Correct
this.faker.person.fullName()
this.faker.internet.email()

// Incorrect (outdated)
// this.faker.name.findName()
```

## Command Examples

### Basic Usage

```bash
# Create a basic factory
npx musket make:factory UserFactory

# With model specification
npx musket make:factory PostFactory --model=Post

# In a subdirectory
npx musket make:factory Blog/CommentFactory --model=Comment
```

### Force Overwrite

```bash
# Overwrite existing factory
npx musket make:factory UserFactory --force

# Update factory structure
npx musket make:factory ProductFactory --model=Product --force
```

### Complete Workflow

```bash
# 1. Create the model
npx musket make:model Product

# 2. Create the factory
npx musket make:factory ProductFactory --model=Product

# 3. Create a seeder
npx musket make:seeder ProductSeeder

# 4. Run seeder
npx musket db:seed
```

The `make:factory` command is an essential tool for generating test data and seeding your H3ravel application, providing a clean and expressive way to create model instances with realistic fake data using Arquebus ORM.