/**
 * @file metro.config.js
 * @description Metro bundler configuration for the Repair Now Partner app.
 *
 * Uses the default React Native preset. Extended here only if custom
 * resolver aliases or asset extensions are needed in the future.
 *
 * @see https://facebook.github.io/metro/docs/configuration
 */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

/** Project-specific overrides — currently using Metro defaults. */
const projectConfig = {};

module.exports = mergeConfig(defaultConfig, projectConfig);
