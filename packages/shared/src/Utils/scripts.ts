export const mainTsconfig = {
  extends: '@h3ravel/shared/tsconfig.base.json',
  compilerOptions: {
    baseUrl: '.',
    outDir: 'dist',
    paths: {
      'src/*': ['./../src/*'],
      'App/*': ['./../src/app/*'],
      'root/*': ['./../*'],
      'routes/*': ['./../src/routes/*'],
      'config/*': ['./../src/config/*'],
      'resources/*': ['./../src/resources/*']
    },
    target: 'es2022',
    module: 'es2022',
    moduleResolution: 'bundler',
    esModuleInterop: true,
    strict: true,
    allowJs: true,
    skipLibCheck: true,
    resolveJsonModule: true,
    noEmit: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true
  },
  include: ['./**/*.d.ts', './../**/*'],
  exclude: [
    '.',
    './../**/console/bin',
    './../dist',
    './../**/dist',
    './../**/node_modules',
    './../.node_modules',
    './../**/node_modules/*',
    './../**/public',
    './../public',
    './../**/storage',
    './../storage',
    './../**coverage**',
    './../eslint.config.js',
    './../jest.config.ts',
    './../arquebus.config.js'
  ]
}

export const baseTsconfig = {
  extends: './.h3ravel/tsconfig.json'
}

export const packageJsonScript = {
  build: 'NODE_ENV=production tsdown --config-loader unconfig -c tsdown.default.config.ts',
  dev: 'NODE_ENV=development pnpm tsdown --config-loader unconfig -c tsdown.default.config.ts',
  start: 'DIST_DIR=dist node -r source-map-support/register dist/server.js',
  lint: 'eslint . --ext .ts',
  test: 'NODE_NO_WARNINGS=1 NODE_ENV=testing jest --passWithNoTests',
  postinstall: 'pnpm prepare'
}
