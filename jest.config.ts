import { createJsWithTsEsmPreset, type JestConfigWithTsJest } from 'ts-jest'
// import { compilerOptions } from './tsconfig.json'

const tsJestTransformCfg = createJsWithTsEsmPreset().transform

const jestConfig: JestConfigWithTsJest = {
  testEnvironment: 'node',
  transform: {
    ...tsJestTransformCfg,
  },
  roots: [
    '<rootDir>/packages/',   // Look for tests in all packages
  ],
  testMatch: ['**/tests/**/*.test.ts'],
  // modulePaths: [compilerOptions.baseUrl],
  // moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
  moduleNameMapper: {
    '@h3ravel/core': '<rootDir>/packages/core/src/index.ts',
    '@h3ravel/router': '<rootDir>/packages/router/src/index.ts',
    '@h3ravel/http': '<rootDir>/packages/http/src/index.ts',
    '@h3ravel/config': '<rootDir>/packages/config/src/index.ts',
    '@h3ravel/filesystem': '<rootDir>/packages/filesystem/src/index.ts',
    '@h3ravel/database': '<rootDir>/packages/database/src/index.ts',
    '@h3ravel/cache': '<rootDir>/packages/cache/src/index.ts',
    '@h3ravel/mail': '<rootDir>/packages/mail/src/index.ts',
    '@h3ravel/queue': '<rootDir>/packages/queue/src/index.ts',
    '@h3ravel/console': '<rootDir>/packages/console/src/index.ts',
    '@h3ravel/support': '<rootDir>/packages/support/src/index.ts',
    '@h3ravel/shared': '<rootDir>/packages/shared/src/index.ts'
  },
}

export default jestConfig
