import { defineConfig } from 'eslint/config'
import { globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default defineConfig(
  {
    languageOptions: {
      parserOptions: {
        // eslint-disable-next-line no-undef
        tsconfigRootDir: process.cwd()
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  [
    globalIgnores([
      'bin/**',
      '**/bin',
      '**/bin/**',
      'dist/**',
      '**/dist',
      '**/dist/**',
      'public/**',
      '**/public',
      '**/public/**',
      '.h3ravel/**',
      '**/.h3ravel',
      '**/.h3ravel/**',
      'node_modules/**',

      '**/bin',
      '**/dist',
      '**/public',
      '**/.h3ravel',
      '**/node_modules'
    ])
  ],
  {
    rules: {
      'semi': ['error', 'never'],
      'quotes': ['error', 'single'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn', {
          'argsIgnorePattern': '^_|_',
          'vars': 'all',
          'args': 'after-used',
          'ignoreRestSiblings': false,
          'varsIgnorePattern': '^I[A-Z]|^_',
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/triple-slash-reference': ['error', {
        'path': 'always'
      }]
    }
  },
)
