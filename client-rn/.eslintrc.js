/**
 * @file .eslintrc.js
 * @description ESLint configuration for the Repair Now Client app.
 *
 * Extends the official React Native community config which enforces:
 *  - React and React Native best practices
 *  - TypeScript type-checking rules
 *  - Accessibility rules for mobile (@react-native/accessibility)
 *
 * Run linting: `npx eslint . --ext .ts,.tsx`
 */
module.exports = {
    root: true,
    extends: [
        '@react-native',               // React Native recommended rules
        'plugin:@typescript-eslint/recommended', // TypeScript rules
    ],
    rules: {
        // Require explicit return types on functions for better code readability
        '@typescript-eslint/explicit-function-return-type': 'warn',

        // Disallow `any` type where possible to maintain type safety
        '@typescript-eslint/no-explicit-any': 'warn',

        // Prevent unused variables from being committed
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

        // Enforce consistent import ordering
        'import/order': ['warn', { alphabetize: { order: 'asc' } }],
    },
    ignorePatterns: ['node_modules/', 'android/', 'ios/', '*.config.js'],
};
