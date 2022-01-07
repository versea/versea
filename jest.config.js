module.exports = {
  verbose: true,
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  setupFilesAfterEnv: [require.resolve('@testing-library/jest-dom/extend-expect')],
  globals: {
    'ts-jest': {
      babelConfig: false,
      tsconfig: './tsconfig.jest.json',
      diagnostics: false,
    },
  },
  collectCoverage: true,
};
