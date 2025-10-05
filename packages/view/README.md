# @h3ravel/view

A view rendering system for the H3ravel framework, providing template rendering capabilities using Edge.js.

## Installation

```bash
npm install @h3ravel/view
# or
pnpm add @h3ravel/view
# or
yarn add @h3ravel/view
```

## Usage

### Basic Usage

```typescript
import { ViewManager } from '@h3ravel/view'

const viewManager = new ViewManager({
  viewsPath: './resources/views',
  cache: process.env.NODE_ENV === 'production'
})

// Render a template
const html = await viewManager.render('welcome', { name: 'John' })
```

### With H3ravel Framework

The view package integrates seamlessly with the H3ravel framework:

```typescript
// In your controller
export class HomeController extends Controller {
  public async index() {
    return await view('home', { 
      title: 'Welcome to H3ravel',
      user: { name: 'John Doe' }
    })
  }
}
```

### Service Provider

The package includes a service provider that automatically registers the view system:

```typescript
import { ViewServiceProvider } from '@h3ravel/view'

// The provider is automatically registered when the package is installed
```

## Features

- **Edge.js Integration**: Built on top of the powerful Edge.js template engine
- **Laravel-like Syntax**: Familiar template syntax for Laravel developers
- **Caching**: Production-ready template caching
- **Global Helpers**: Access to framework helpers within templates
- **Pluggable**: Can be used independently or as part of H3ravel

## Template Syntax

The view system uses Edge.js syntax:

```edge
{{-- resources/views/welcome.edge --}}
<!DOCTYPE html>
<html>
<head>
  <title>{{ title }}</title>
</head>
<body>
  <h1>Hello, {{ user.name }}!</h1>
  
  @if(user.isAdmin)
    <p>Welcome, admin!</p>
  @endif
  
  @each(item in items)
    <div>{{ item.name }}</div>
  @endeach
</body>
</html>
```

## Configuration

```typescript
interface ViewConfig {
  viewsPath: string      // Path to views directory
  cache?: boolean        // Enable/disable caching
  globals?: object       // Global variables available in all templates
}
```

## API Reference

### ViewManager

The main class for managing view rendering.

#### Methods

- `render(template: string, data?: object): Promise<string>` - Render a template
- `exists(template: string): boolean` - Check if template exists
- `mount(path: string): void` - Mount additional view directory
- `global(key: string, value: any): void` - Add global variable

### ViewServiceProvider

Service provider for automatic integration with H3ravel framework.

## License

MIT License. See [LICENSE](../../LICENSE) for more information.
