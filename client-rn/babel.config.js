/**
 * @file babel.config.js
 * @description Babel configuration for the Repair Now Client app.
 *
 * Uses the official React Native Babel preset which handles:
 *  - JSX transform for React 18 (no need to import React in every file)
 *  - TypeScript transpilation
 *  - Decorators (needed by some libraries)
 *  - Module path aliases via `module-resolver`
 *
 * The `react-native-dotenv` plugin exposes .env variables as
 * process.env.VARIABLE_NAME at runtime — safe for non-secret config.
 */
module.exports = {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
        /**
         * Exposes .env variables to the JS bundle.
         * Never put secret keys in .env for client-side apps.
         * The API_BASE_URL is the only variable used here.
         */
        ['module:react-native-dotenv', {
            moduleName: '@env',
            path: '.env',
            safe: true,
            allowUndefined: false,
        }],
    ],
};
