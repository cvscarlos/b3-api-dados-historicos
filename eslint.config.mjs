import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import unicornPlugin from 'eslint-plugin-unicorn';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/await-thenable': 'off',
    },
  },
  {
    plugins: {
      prettier: prettierPlugin,
      unicorn: unicornPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      ...unicornPlugin.configs.recommended.rules,
      'prettier/prettier': 'error',
      'no-plusplus': 'off',
      'no-continue': 'off',
      'no-use-before-define': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/catch-error-name': 'off',
      'unicorn/no-array-sort': 'off',
      'unicorn/no-abusive-eslint-disable': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**'],
  }
);