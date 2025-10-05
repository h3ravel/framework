# Console Commands

This document explains how to create, register, and use console commands in your H3ravel application using the Musket CLI system.

## Creating a Command

To create a new command, you can use the `make:command` Musket command:

```bash
npx musket make:command MyCommand
```

This will create a new file at `app/Console/Commands/MyCommand.ts`.

A new command looks like this:

```typescript
import { Command } from '@h3ravel/console';

export class MyCommand extends Command {
  /**
   * The name and signature of the console command.
   */
  protected signature: string = 'my:command';

  /**
   * The console command description.
   */
  protected description: string = 'Command description';

  /**
   * Execute the console command.
   */
  public async handle(): Promise<void> {
    // Your command logic here
    this.info('Command executed successfully!');
  }
}
```

### Command Signature

The `signature` property defines the command's name, arguments, and options using H3ravel's expressive syntax.

**Basic Command:**

```typescript
protected signature = 'my:command';
```

**Arguments:**

```typescript
protected signature = 'user:create {name}';
```

**Optional Arguments:**

```typescript
protected signature = 'user:create {name} {email?}';
```

**Arguments with Descriptions:**

```typescript
protected signature = 'user:create {name : The user name} {email? : User email address}';
```

**Boolean Options (Flags):**

```typescript
protected signature = 'user:create {name} {--admin : Make user an admin}';
```

**Options with Values:**

```typescript
protected signature = 'backup:create {--format=zip : Backup format}';
```

**Options with Shortcuts:**

```typescript
protected signature = 'serve:start {--p|port=3000 : Server port}';
```

**Complex Example:**

```typescript
protected signature = `user:create
    {name : The user name}
    {email? : User email address}
    {--admin : Grant admin privileges}
    {--role=user : User role}
    {--f|force : Skip confirmation}`;
```

**Namespace Commands:**

```typescript
protected signature = `cache:
    {clear : Clear all cached data}
    {flush : Flush entire cache store}
    {warm : Warm up the cache}
    {--store=default : Cache store name}`;
```

### Command Description

The `description` property provides a short description of your command that appears when running `npx musket list`.

### Command Logic

The `handle` method contains your command's logic. Use the inherited methods to interact with users:

```typescript
public async handle(): Promise<void> {
    // Get arguments and options
    const name = this.argument('name');
    const isAdmin = this.option('admin');

    // Output methods
    this.info('Processing...');
    this.success('Operation completed!');
    this.error('Something went wrong');
    this.warn('This is a warning');
}
```

## Command Input/Output

### Accessing Input

```typescript
public async handle(): Promise<void> {
    // Required arguments
    const name = this.argument('name');

    // Optional arguments with defaults
    const email = this.argument('email', 'default@example.com');

    // Boolean options
    const force = this.option('force'); // true/false

    // Options with values
    const role = this.option('role'); // string or undefined
    const port = this.option('port', '3000'); // with default

    // Check if option exists
    if (this.hasOption('admin')) {
        this.info('Admin mode enabled');
    }
}
```

### Output Methods

```typescript
public async handle(): Promise<void> {
    // Basic output
    this.info('Information message');
    this.success('Success message');
    this.error('Error message');
    this.warn('Warning message');
    this.line('Plain text');
    this.newLine(); // Empty line

    // Debug output (shown with --verbose)
    this.debug('Debug information');
}
```

### Advanced Output with Logger

For more sophisticated output formatting:

```typescript
import { Logger } from '@h3ravel/shared';

public async handle(): Promise<void> {
    // Colored output
    Logger.info('Processing data...');
    Logger.success('Operation completed');

    // Two-column layout
    Logger.twoColumnDetail('Operation', 'Status');
    Logger.twoColumnDetail('Database migration', 'COMPLETE');

    // Custom colored text
    const message = Logger.parse([
        ['Processed', 'white'],
        ['100 items', 'green'],
        ['successfully', 'white']
    ], ' ', false);
    Logger.info(message);
}
```

## Command Registration

### Auto-Discovery

Commands are automatically discovered from the `app/Console/Commands` directory. Simply place your command files there:

```
src/app/Console/Commands/
├── CreateUserCommand.ts
├── SendEmailCommand.ts
└── ProcessDataCommand.ts
```

### Manual Registration

You can also register commands manually in a service provider:

```typescript
import { ServiceProvider } from '@h3ravel/core';
import { MyCommand } from '../Console/Commands/MyCommand';

export class CommandServiceProvider extends ServiceProvider {
  public async register(): Promise<void> {
    this.app.registeredCommands.push(MyCommand);
  }
}
```

## Command Lifecycle

The H3ravel command system follows this execution flow:

1. **Application Bootstrap**: `fire.ts` entry point starts the console application
2. **Service Loading**: `IO/app.ts` bootstraps the application and loads service providers including `ConsoleServiceProvider`
3. **Kernel Initialization**: The `Kernel.ts` `init` method is called to set up the command environment
4. **Musket CLI Setup**:
   - `Musket.ts` `parse` method calls the `build` method
   - Base commands are loaded (make, list, postinstall)
   - Commands are discovered from `app/Console/Commands` directory
   - `initialize` method creates Commander.js instance and registers all commands
   - `preAction` hook rebuilds the app before each command execution (except `fire`)
5. **Command Execution**: The command's `handle` method is invoked with parsed arguments and options
6. **Output**: Results are displayed to the user through the output system

### Built-in Commands

H3ravel includes several built-in commands:

- `make:*` - Code generation commands
- `migrate:*` - Database migration commands
- `fire` - Development server
- `storage:link` - Storage symbolic links
- `list` - Show all available commands

## Running Commands

### Development

```bash
# Basic command execution
npx musket my:command

# With arguments
npx musket user:create "John Doe"

# With options
npx musket user:create "Jane Doe" --admin --role=moderator

# With shortcuts
npx musket serve:start --p=8080

# Show help for a command
npx musket help user:create
```

### Production

```bash
# Build and run commands in production
npm run build
npx musket migrate:run
npx musket cache:clear
```

## Best Practices

### Command Design

- **Single Responsibility**: Keep commands focused on one specific task
- **Clear Naming**: Use descriptive names with appropriate namespaces (`user:create`, `cache:clear`)
- **Consistent Signatures**: Follow consistent patterns for similar operations

```typescript
// ✅ Good: Clear, focused command
export class CreateUserCommand extends Command {
  protected signature = 'user:create {name} {--admin}';
  protected description = 'Create a new user account';
}

// ❌ Avoid: Generic, unclear commands
export class DoStuffCommand extends Command {
  protected signature = 'stuff';
  protected description = 'Does stuff';
}
```

### Error Handling

Always provide helpful error messages and handle edge cases:

```typescript
public async handle(): Promise<void> {
    try {
        const result = await this.performOperation();
        this.success('Operation completed successfully');
    } catch (error) {
        if (error.code === 'ENOENT') {
            this.error('Configuration file not found. Run `npx musket init` first.');
            return;
        }

        this.debug(`Detailed error: ${error.message}`);
        this.error('Operation failed. Use --verbose for more details.');
    }
}
```

### User Experience

Provide clear feedback and progress indicators:

```typescript
public async handle(): Promise<void> {
    const items = await this.getItems();

    if (items.length === 0) {
        this.info('No items to process.');
        return;
    }

    this.info(`Processing ${items.length} items...`);

    for (let i = 0; i < items.length; i++) {
        await this.processItem(items[i]);

        if ((i + 1) % 10 === 0) {
            this.info(`Progress: ${i + 1}/${items.length} completed`);
        }
    }

    this.success(`Successfully processed ${items.length} items!`);
}
```

### Input Validation

Validate user input and provide clear error messages:

```typescript
public async handle(): Promise<void> {
    const name = this.argument('name');

    if (!name || name.trim().length === 0) {
        this.error('Name is required and cannot be empty');
        return;
    }

    const email = this.option('email');
    if (email && !this.isValidEmail(email)) {
        this.error('Please provide a valid email address');
        return;
    }

    // Continue with validated input
    await this.createUser(name, email);
}

private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

## Advanced Patterns

### Namespace Commands

Create commands with multiple sub-actions:

```typescript
export class CacheCommand extends Command {
  protected signature = `cache:
        {clear : Clear all cached data}
        {flush : Flush entire cache store}
        {warm : Warm up the cache}
        {--store=default : Cache store to use}`;

  protected description = 'Manage application cache';

  public async handle(): Promise<void> {
    const action = this.dictionary.name || this.dictionary.baseCommand;

    switch (action) {
      case 'clear':
        await this.clearCache();
        break;
      case 'flush':
        await this.flushCache();
        break;
      case 'warm':
        await this.warmCache();
        break;
      default:
        this.error(`Unknown action: ${action}`);
    }
  }
}
```

### Batch Processing

Handle large datasets efficiently:

```typescript
export class ProcessDataCommand extends Command {
  protected signature = `data:process
        {--batch=100 : Batch size}
        {--dry-run : Preview without executing}`;

  public async handle(): Promise<void> {
    const batchSize = parseInt(this.option('batch', '100'));
    const isDryRun = this.option('dry-run');

    const records = await this.getRecords();
    const batches = this.chunkArray(records, batchSize);

    if (isDryRun) {
      this.info(
        `Would process ${records.length} records in ${batches.length} batches`
      );
      return;
    }

    for (const [index, batch] of batches.entries()) {
      await this.processBatch(batch);
      this.info(`Completed batch ${index + 1}/${batches.length}`);
    }

    this.success(`Processed ${records.length} records`);
  }
}
```
