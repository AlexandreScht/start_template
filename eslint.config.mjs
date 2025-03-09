// eslint.config.mjs
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    // On limite le linting aux fichiers du dossier "src" (y compris .jsx et .tsx)
    files: ['src/**/*.{js,mjs,jsx,ts,tsx}'],
    // On ignore les dossiers indésirables
    ignores: ['node_modules', 'dist', 'src/logs', 'src/commands'],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
      'react-hooks': reactHooks,
    },

    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      // Les règles Next spécifiques (core-web-vitals) sont retirées ici.
      ...prettierPlugin.configs.recommended.rules,
      'no-trailing-spaces': 'error',
      'no-irregular-whitespace': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },

    // Pas besoin de settings spécifiques à Next.js si on ne charge pas le plugin.
    settings: {},
  },
];
