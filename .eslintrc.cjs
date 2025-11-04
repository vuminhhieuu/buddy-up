module.exports = {
  root: true,
  env: { es2022: true, node: true, jest: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', project: false },
  settings: { react: { version: 'detect' } },
  plugins: ['@typescript-eslint', 'react', 'react-native', 'react-hooks', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-native/all',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react-native/no-inline-styles': 'off',
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '.expo/', 'coverage/'],
};


