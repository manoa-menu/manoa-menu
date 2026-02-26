import { dirname } from 'path';
import { fileURLToPath } from 'url';
import nextConfig from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

const __dirname = dirname(fileURLToPath(import.meta.url));

const eslintConfig = tseslint.config(
  // Next.js core web vitals (already flat config in v16)
  ...nextConfig,

  // TypeScript ESLint recommended rules (replaces airbnb-typescript)
  ...tseslint.configs.recommended,

  // Prettier compat (must be last to turn off conflicting rules)
  eslintConfigPrettier,

  // Ignore config file itself and other non-src files from type-checked linting
  {
    ignores: ['eslint.config.mjs', 'next.config.mjs'],
  },

  // Custom rules (ported from .eslintrc.json)
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      'arrow-parens': 'off',
      'func-names': 'off',
      'linebreak-style': 'off',
      'max-len': ['error', 120],
      'no-console': 'off',
      'no-plusplus': 'off',
      'no-restricted-syntax': 'off',
      'no-return-assign': 'off',
      'object-curly-newline': 'off',
      'prefer-arrow-callback': 'off',
      'import/no-extraneous-dependencies': [
        'error',
        { devDependencies: ['**/*.test.ts', '**/*.spec.ts', '**/*.config.ts', '**/*.config.mjs'] },
      ],
      'react/function-component-definition': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/one-expression-per-line': 'off',
      'react/react-in-jsx-scope': 'off',
      // Relax strict typescript-eslint rules for existing codebase
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },
);

export default eslintConfig;
