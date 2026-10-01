import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '.test-compile/**'] },
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts', 'playwright.config.ts', 'scripts/*.mjs'],
    languageOptions: { parser: tseslint.parser, globals: { ...globals.browser, ...globals.node } },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off', // tsc owns unused declarations in application code.
      'no-undef': 'off', // TypeScript owns name resolution.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
)
