module.exports = {
  verbose: true,
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testEnvironment: 'jsdom',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  watchPlugins: ['jest-watch-lerna-packages'],
  collectCoverageFrom: ['packages/*/src/**/*.{js,jsx,ts,tsx}'],
  setupFilesAfterEnv: [require.resolve('@testing-library/jest-dom/extend-expect')],
};
