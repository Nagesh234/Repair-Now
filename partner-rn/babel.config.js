/**
 * @file babel.config.js
 * @description Babel configuration for the Repair Now Partner app.
 *
 * Uses the official React Native Babel preset. The react-native-dotenv
 * plugin exposes .env variables as process.env.VARIABLE_NAME at runtime.
 */
module.exports = {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
        ['module:react-native-dotenv', {
            moduleName: '@env',
            path: '.env',
            safe: true,
            allowUndefined: false,
        }],
    ],
};
