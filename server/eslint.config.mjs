// eslint.config.mjs
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  {
    files: ['src/**/*.{js,mjs,cjs,ts}'],
    ignores: ['node_modules', 'dist', 'src/logs', 'src/commands'],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.jest,
        ...globals.node,
        ...globals.browser,
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },

    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
          fixStyle: 'inline-type-imports',
        },
      ],
      // '@typescript-eslint/explicit-member-accessibility': 0,
      // '@typescript-eslint/explicit-function-return-type': 0,
      // '@typescript-eslint/no-parameter-properties': 0,
      // '@typescript-eslint/interface-name-prefix': 0,
      // '@typescript-eslint/explicit-module-boundary-types': 0,
      // '@typescript-eslint/no-explicit-any': 'off',
      // '@typescript-eslint/ban-types': 'off',
      // '@typescript-eslint/no-var-requires': 'off',
    },
  },
];
