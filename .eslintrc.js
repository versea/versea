module.exports = {
  env: {
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/all",
    "plugin:prettier/recommended",
  ],
  globals: {
    fetch: true,
    FormData: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint",
    "jest",
    "json",
    "prettier",
    "markdown",
  ],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 10,
    ecmaFeatures: {
      jsx: true
    },
  },
  overrides: [
    {
      "files": ["**/*.md"],
      "processor": "markdown/markdown"
    },
    {
      "files": ["**/*.md/*.{js,ts,jsx,tsx}"],
      "rules": {
        "@typescript-eslint/no-unused-vars": "error",
        "no-unused-vars": "error",
        "no-console": "off",
      }
    },
    {
      files: ["*.{spec,test}.{js,ts,tsx}", "**/__tests__/**/*.{js,ts,tsx}"],
      env: {
        jest: true,
        "jest/globals": true,
      },
      rules: {
        "max-nested-callbacks": "off"
      }
    }
  ],
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/no-var-requires": "error",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/ban-ts-comment": "off",
  }
};
