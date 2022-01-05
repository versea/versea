module.exports = {
  verbose: true,
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**/*.spec.[jt]s?(x)'],
  setupFilesAfterEnv: [
    require.resolve('jest-dom/extend-expect'),
  ],
  globals: {
    'ts-jest': {
      babelConfig: false,
      tsconfig: './tsconfig.jest.json',
      diagnostics: false,
    },
  },
}
