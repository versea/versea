const TypescriptRules = {
  '@typescript-eslint/no-redeclare': 'off',
  '@typescript-eslint/no-type-alias': 'off',
  '@typescript-eslint/strict-boolean-expressions': 'off',
  '@typescript-eslint/prefer-readonly-parameter-types': 'off',
  '@typescript-eslint/consistent-type-imports': 'off',
  '@typescript-eslint/explicit-member-accessibility': [
    'error',
    {
      accessibility: 'explicit',
      overrides: {
        constructors: 'off',
      },
    },
  ],
  '@typescript-eslint/naming-convention': [
    'error',
    {
      selector: 'default',
      format: ['camelCase'],
      leadingUnderscore: 'allow',
    },
    {
      selector: 'variable',
      format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
    },
    {
      selector: 'parameter',
      format: ['camelCase'],
      leadingUnderscore: 'allow',
    },
    {
      selector: 'memberLike',
      modifiers: ['private'],
      format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
      leadingUnderscore: 'require',
    },
    {
      selector: 'enumMember',
      format: ['UPPER_CASE'],
    },
    {
      selector: 'typeLike',
      format: ['PascalCase'],
    },
  ],
  'import/order': [
    'error',
    {
      groups: ['builtin', 'external', 'internal', ['index', 'sibling', 'parent'], 'object', 'type'],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true,
      },
    },
  ],
  '@typescript-eslint/no-magic-numbers': ['error', { ignore: [-1, 0, 1] }],
};

module.exports = {
  env: {
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended', 'plugin:import/recommended'],
  globals: {
    fetch: true,
    FormData: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jest', 'json', 'prettier', 'markdown'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 10,
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.eslint.json',
  },
  overrides: [
    {
      files: ['**/*.md'],
      processor: 'markdown/markdown',
    },
    {
      files: ['**/*.{js,jsx}'],
      rules: {
        'no-unused-vars': 'error',
        'no-console': 'off',
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/all',
        'plugin:prettier/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
      ],
      rules: {
        ...TypescriptRules,
        'no-unused-vars': 'error',
        'no-console': 'off',
      },
    },
    {
      files: ['*.{spec,test}.{js,jsx}', '**/__tests__/**/*.{js,jsx}'],
      env: {
        jest: true,
        'jest/globals': true,
      },
      rules: {
        'max-nested-callbacks': 'off',
      },
    },
    {
      files: ['*.{spec,test}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
      env: {
        jest: true,
        'jest/globals': true,
      },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/all',
        'plugin:prettier/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
      ],
      rules: {
        ...TypescriptRules,
        'max-nested-callbacks': 'off',
        '@typescript-eslint/no-extraneous-class': 'off',
      },
    },
  ],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
