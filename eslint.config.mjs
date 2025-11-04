import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['node_modules/', 'dist/', 'build/', '.expo/', 'coverage/', '**/*.config.js'],
  },
  // Base config
  js.configs.recommended,
  // TypeScript recommended configs
  ...tseslint.configs.recommended,
  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.browser,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      prettier,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...reactNative.configs.all.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react-native/no-inline-styles': 'off',
      'eol-last': ['error', 'always'],
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1, maxBOF: 0 }],
    },
  },
);
