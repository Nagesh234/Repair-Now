/**
 * index.js — Repair Now Partner App entry point.
 *
 * Registers the root React component with the Android/iOS bridge.
 * Component name 'RepairNowPartner' must match MainActivity.kt.
 */
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('RepairNowPartner', () => App);
