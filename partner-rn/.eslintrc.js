/** @file .eslintrc.js — ESLint config for Repair Now Partner app. */
module.exports = {
    root: true,
    extends: ['@react-native', 'plugin:@typescript-eslint/recommended'],
    rules: {
        '@typescript-eslint/explicit-function-return-type': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
    ignorePatterns: ['node_modules/', 'android/', 'ios/', '*.config.js'],
};
