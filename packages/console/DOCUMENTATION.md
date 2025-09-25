
# Console Commands

This document explains how to create, register, and use console commands in your H3ravel application.

## Creating a Command

To create a new command, you can use the `make:command` Musket command:

```bash
php musket make:command MyCommand
```

This will create a new file at `app/Console/Commands/MyCommand.ts`.

A new command looks like this:

```typescript
import { Command } from '@h3ravel/console';

export class MyCommand extends Command {
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected signature = 'my:command';

    /**
     * The console command description.
     *
     * @var string
     */
    protected description = 'Command description';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public async handle() {
        // ...
    }
}
```

### Command Signature

The `signature` property is where you define the command's name, arguments, and options.

**Arguments:**

```typescript
protected signature = 'my:command {name}';
```

**Optional Arguments:**

```typescript
protected signature = 'my:command {name?}';
```

**Options:**

```typescript
protected signature = 'my:command {--force}';
```

**Options with Values:**

```typescript
protected signature = 'my:command {--env=}';
```

### Command Description

The `description` property is a short description of your command that will be displayed when running `musket list`.

### Command Logic

The `handle` method is where you put the logic for your command.

## Registering a Command

Commands are automatically discovered from the `app/Console/Commands` directory. You don't need to register them manually.

## Command Lifecycle

1.  **`fire.ts`:** The entry point of the console application.
2.  **`IO/app.ts`:** Bootstraps the application, loads service providers, including `ConsoleServiceProvider`.
3.  **`Kernel.ts`:** The `init` method of the `Kernel` class is called.
4.  **`Musket.ts`:**
    *   The `parse` method is called, which in turn calls the `build` method.
    *   The `build` method loads the base commands and discovers the commands in the `app/Console/Commands` directory.
    *   The `initialize` method creates the `commander` instance and adds all the commands.
    *   A `preAction` hook is registered to rebuild the app before each command (except `fire`).
5.  **Command Execution:** The `handle` method of the command is called.

## Best Practices

*   Keep your commands simple and focused on a single task.
*   Use the `description` property to provide a clear and concise description of your command.
*   Use the `handle` method to contain all the logic for your command.
*   Use the `input` and `output` properties to interact with the user.
