import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import reactCompilerPlugin from 'eslint-plugin-react-compiler';

export default tseslint.config(
  {
    ignores: [
      '**/dist',
      '**/build',
      '**/node_modules',
      '**/.cache',
      '**/public',
    ],
  },
  {
    // Apply baseline JavaScript / TypeScript rules to everything
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    rules: {
      // Downgrade errors to warnings to allow gradual fixing
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/triple-slash-reference': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-namespace': 'warn',
      'prefer-const': 'warn',
      'no-async-promise-executor': 'warn',
      'no-empty-pattern': 'warn',
      'no-undef': 'off', // TypeScript handles this usually, or globals plugin is needed
    },
  },
  {
    // React-specific rules applied only to the client directory
    files: ['client/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
      'react-compiler': reactCompilerPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/jsx-key': 'warn',
      // Downgrade potentially blocking react rules to warning
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-compiler/react-compiler': 'warn',
    },
  }
);
