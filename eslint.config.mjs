import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';
import securityPlugin from 'eslint-plugin-security';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import jestDomPlugin from 'eslint-plugin-jest-dom';

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  fetch: 'readonly',
  Headers: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  console: 'readonly',
};

const nodeGlobals = {
  module: 'readonly',
  require: 'readonly',
  process: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  Buffer: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  global: 'readonly',
};

const reactRecommended = reactPlugin.configs.flat?.recommended ?? reactPlugin.configs.recommended;
const testingLibraryReact =
  testingLibraryPlugin.configs['flat/react'] ?? testingLibraryPlugin.configs.react;
const jestDomRecommended =
  jestDomPlugin.configs['flat/recommended'] ?? jestDomPlugin.configs.recommended;

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      'apps/**',
      'analysis/**',
      'backend/**',
      'ops/**',
      'patches/**',
      'qa/**',
      'rentguy*/**',
      'reports/**',
      'testing/**',
      'tests/**',
      'warehouse/**',
      '**/node_modules/**',
      '**/*.py',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      reactRecommended,
      reactHooksPlugin.configs.recommended,
      jsxA11yPlugin.configs.recommended,
      importPlugin.configs.recommended,
      sonarjsPlugin.configs.recommended,
      unicornPlugin.configs.recommended,
      securityPlugin.configs.recommended,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir,
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...browserGlobals,
        ...nodeGlobals,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript: {
          project: path.join(tsconfigRootDir, 'tsconfig.json'),
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
      'jsx-a11y': jsxA11yPlugin,
      sonarjs: sonarjsPlugin,
      unicorn: unicornPlugin,
      security: securityPlugin,
      'testing-library': testingLibraryPlugin,
      'jest-dom': jestDomPlugin,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'import/order': [
        'error',
        {
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            camelCase: true,
            pascalCase: true,
          },
        },
      ],
      'unicorn/no-null': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'security/detect-object-injection': 'off',
    },
  },
  {
    files: [
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      'tests/**/*.{ts,tsx,js,jsx}',
    ],
    extends: [testingLibraryReact, jestDomRecommended].filter(Boolean),
    rules: {
      'unicorn/no-null': 'off',
    },
  }
);
