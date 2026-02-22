/**
 * index.js — Repair Now Client App entry point.
 *
 * Registers the root React component with the Android/iOS bridge.
 * The component name 'RepairNowClient' must match:
 *   - MainActivity.kt: getMainComponentName() → "RepairNowClient"
 *   - This AppRegistry.registerComponent call
 */
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('RepairNowClient', () => App);
