# Build Command

The `musket build` command compiles your H3ravel application for production deployment. It processes your TypeScript source code, bundles dependencies, and creates an optimized production build using tsdown.

## Usage

```bash
# Basic production build
npx musket build

# Build with minification
npx musket build --minify

# Build with verbose output
npx musket build --verbose

# Silent build (no output)
npx musket build --quiet
```

## Command Options

| Option | Shortcut | Description |
|--------|----------|-------------|
| `--minify` | `-m` | Minify the bundle output for smaller file sizes |
| `--verbose` | `-v` | Increase output verbosity (levels: 1-3) |
| `--quiet` | `-q` | Suppress all output messages |
| `--silent` | - | Alias for --quiet |

## What the Build Command Does

The build process performs several operations:

1. **Compiles TypeScript** - Converts `.ts` files to JavaScript
2. **Bundles Code** - Creates optimized bundles using tsdown
3. **Copies Assets** - Moves public files, views, and database files to output directory
4. **Generates Sourcemaps** - Creates sourcemaps for debugging (development mode only)
5. **Optimizes Output** - Minifies code when `--minify` is specified
6. **Cleans Directory** - Removes old build artifacts before building

## Output Directory

By default, builds are created in the `dist/` directory:

```
dist/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   ├── Models/
│   └── Providers/
├── bootstrap/
├── config/
├── public/
├── resources/
│   └── views/
├── routes/
└── server.js
```

### Custom Output Directory

You can customize the output directory using the `DIST_DIR` environment variable:

```bash
# Build to custom directory
DIST_DIR=build npx musket build

# Build to version-specific directory
DIST_DIR=releases/v1.0.0 npx musket build
```

## Build Configuration

The build process uses `tsdown` with configuration from `tsdown.default.config.ts`. Key configuration options:

### Default Build Settings

```typescript
{
  outDir: 'dist',                    // Output directory
  entry: ['src/**/*.ts'],            // Entry points
  format: ['esm'],                   // ES modules format
  target: 'node22',                  // Node.js 22 target
  sourcemap: false,                  // No sourcemaps in production
  minify: false,                     // Minification disabled by default
  clean: true,                       // Clean output directory before build
  shims: true,                       // Include Node.js shims
  skipNodeModulesBundle: true        // Don't bundle node_modules
}
```

### Environment Variables

The build command sets these environment variables:

| Variable | Value | Purpose |
|----------|-------|---------|
| `NODE_ENV` | `production` | Sets production environment |
| `CLI_BUILD` | `true` | Indicates build via CLI |
| `DIST_DIR` | `dist` | Output directory path |
| `DIST_MINIFY` | `false` | Minification flag |
| `EXTENDED_DEBUG` | `false` | Extended debug mode |
| `LOG_LEVEL` | `silent` | Logging verbosity level |

## Examples

### Basic Production Build

```bash
# Create production build
npx musket build
```

**Output:**
```
 INFO  Creating Production Bundle

[Building... progress indicators]

 SUCCESS  Production Bundle Created
```

**Result:** Compiled application in `dist/` directory

### Minified Build

```bash
# Build with code minification
npx musket build --minify
```

**Benefits:**
- Smaller bundle size
- Faster load times
- Reduced bandwidth usage

**Use case:** Production deployments where file size matters

### Verbose Build

```bash
# Build with detailed output
npx musket build --verbose
```

**Output includes:**
- File compilation details
- Bundle size information
- Asset copying status
- Build timing information

**Use case:** Debugging build issues or monitoring build performance

### Silent Build

```bash
# Build with no output
npx musket build --quiet
```

**Use case:** CI/CD pipelines where you only care about exit codes

### Custom Directory Build

```bash
# Build to custom directory
DIST_DIR=build npx musket build --minify
```

**Result:** Compiled application in `build/` directory

## Build Process Details

### 1. Pre-Build Phase

- Detects package manager (pnpm, npm, yarn)
- Reads environment variables
- Validates configuration
- Cleans output directory

### 2. Compilation Phase

```
src/
├── app/              → dist/app/
├── bootstrap/        → dist/bootstrap/
├── config/           → dist/config/
├── routes/           → dist/routes/
└── server.ts         → dist/server.js
```

### 3. Asset Copying

```
public/               → dist/public/
src/resources/        → dist/resources/
src/database/         → dist/database/
```

**Note:** Migration, factory, and seeder files in the database directory are automatically removed after build to keep the production bundle clean.

### 4. Post-Build Cleanup

- Removes `database/migrations/` from output
- Removes `database/factories/` from output
- Removes `database/seeders/` from output

These are development-only files and aren't needed in production.

## Integration with Package Managers

The build command automatically detects your package manager:

### Using pnpm (default)

```bash
npx musket build
# Executes: pnpm tsdown [options]
```

### Using npm

```bash
npx musket build
# Executes: npm tsdown [options]
```

### Using yarn

```bash
npx musket build
# Executes: yarn tsdown [options]
```

## Build Output Structure

### Typical Production Build

```
dist/
├── app/
│   ├── Console/
│   │   └── Commands/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── HomeController.js
│   │   │   └── UserController.js
│   │   └── Middlewares/
│   ├── Models/
│   │   └── user.js
│   └── Providers/
│       └── AppServiceProvider.js
├── bootstrap/
│   ├── app.js
│   └── providers.js
├── config/
│   ├── app.js
│   ├── database.js
│   └── cache.js
├── database/
│   └── db.sqlite
├── public/
│   ├── favicon.ico
│   └── assets/
├── resources/
│   └── views/
│       └── index.edge
├── routes/
│   ├── api.js
│   └── web.js
└── server.js
```

## Running the Production Build

After building, start your application:

```bash
# Standard start
node dist/server.js

# With environment variables
NODE_ENV=production node dist/server.js

# Using package.json script
npm start
```

### Package.json Start Script

Add to your `package.json`:

```json
{
  "scripts": {
    "build": "npx musket build",
    "start": "node dist/server.js",
    "build:prod": "npx musket build --minify"
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build application
        run: npx musket build --minify
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

### GitLab CI

```yaml
build:
  stage: build
  image: node:22
  script:
    - npm install
    - npx musket build --minify
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
```

### Docker

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npx musket build --minify

FROM node:22-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm install --production

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## Troubleshooting

### Build Fails with TypeScript Errors

```bash
# Check TypeScript configuration
npx tsc --noEmit

# Fix type errors before building
npx musket build
```

### Out of Memory Error

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npx musket build
```

### Missing Dependencies

```bash
# Ensure all dependencies are installed
npm install

# Clear cache and rebuild
rm -rf node_modules dist
npm install
npx musket build
```

### Build Taking Too Long

```bash
# Use minification only when needed
npx musket build  # Without --minify for faster builds

# Check for large dependencies
npx musket build --verbose
```

### Output Directory Permissions

```bash
# Ensure write permissions
chmod -R 755 dist/

# Or use custom directory
DIST_DIR=~/builds/app npx musket build
```

## Best Practices

### 1. Clean Builds

Always ensure a clean build for production:

```bash
# Remove old build artifacts
rm -rf dist/

# Build fresh
npx musket build --minify
```

### 2. Version Control

Add build artifacts to `.gitignore`:

```gitignore
# Build outputs
dist/
build/
.h3ravel/

# Environment files
.env.local
.env.production
```

### 3. Environment-Specific Builds

```bash
# Development build (with sourcemaps)
NODE_ENV=development npx musket build

# Production build (optimized)
NODE_ENV=production npx musket build --minify

# Staging build
NODE_ENV=staging DIST_DIR=dist-staging npx musket build
```

### 4. Build Validation

Verify build before deployment:

```bash
# Build the application
npx musket build --minify

# Test the build locally
node dist/server.js

# Run smoke tests
npm run test:smoke
```

### 5. Automated Builds

Set up pre-deployment hooks:

```json
{
  "scripts": {
    "prebuild": "npm run lint && npm run test",
    "build": "npx musket build --minify",
    "postbuild": "npm run validate"
  }
}
```

## Performance Optimization

### Build Time Optimization

```bash
# Skip minification during development
npx musket build

# Use minification only for production
npx musket build --minify
```

### Bundle Size Optimization

```bash
# Build with minification
npx musket build --minify

# Analyze bundle size
du -sh dist/

# Check for large files
find dist/ -type f -size +1M
```

## Related Commands

- `npx musket fire` - Start development server with hot reload
- `npx musket migrate:run` - Run database migrations
- `npx musket route:list` - List all application routes

## Common Workflows

### Development Workflow

```bash
# 1. Make changes to code
# 2. Test with dev server
npx musket fire

# 3. Build for testing
npx musket build

# 4. Test production build
node dist/server.js
```

### Deployment Workflow

```bash
# 1. Clean old builds
rm -rf dist/

# 2. Install dependencies
npm install --production=false

# 3. Run tests
npm test

# 4. Build for production
npx musket build --minify

# 5. Deploy dist/ directory
```

### CI/CD Workflow

```bash
# 1. Install dependencies (CI)
npm ci

# 2. Run linting
npm run lint

# 3. Run tests
npm test

# 4. Build application
npx musket build --minify --quiet

# 5. Deploy artifacts
```

The `musket build` command is essential for preparing your H3ravel application for production deployment, creating optimized, ready-to-run bundles from your TypeScript source code.