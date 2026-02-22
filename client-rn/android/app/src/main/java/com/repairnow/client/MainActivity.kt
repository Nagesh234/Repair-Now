package com.repairnow.client

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

/**
 * MainActivity.kt — Repair Now Client App
 *
 * The single Activity that hosts the React Native JavaScript bundle.
 * React Navigation handles all in-app screen transitions — no additional
 * Activities are needed.
 *
 * Declared in AndroidManifest.xml with android:exported="true" and the
 * MAIN/LAUNCHER intent filter (required for API 31+).
 */
class MainActivity : ReactActivity() {

    /**
     * The name of the JS entry point in index.js / App.tsx.
     * Must match the `AppRegistry.registerComponent` call.
     */
    override fun getMainComponentName(): String = "RepairNowClient"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
