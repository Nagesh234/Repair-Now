/**
 * @file metro.config.js
 * @description Metro bundler configuration for the Repair Now Client app.
 *
 * Uses the default React Native preset. Extended here only if custom
 * resolver aliases or asset extensions are needed in the future.
 *
 * @see https://facebook.github.io/metro/docs/configuration
 */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/** Metro defaults provided by React Native 0.73+ */
const defaultConfig = getDefaultConfig(__dirname);

/**
 * Project-specific overrides.
 * Currently empty — using all Metro defaults.
 */
const projectConfig = {};

module.exports = mergeConfig(defaultConfig, projectConfig);
