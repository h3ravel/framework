// eslint.config.js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**'],
    rules: {
      'semi': ['error', 'never'],
      'quotes': ['error', 'single'],
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_|_' }],
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
)
