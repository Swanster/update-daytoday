module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 60000,
  maxWorkers: 1, // Run tests sequentially to avoid MongoDB conflicts
  setupFilesAfterEnv: ['./tests/setup.js']
};
