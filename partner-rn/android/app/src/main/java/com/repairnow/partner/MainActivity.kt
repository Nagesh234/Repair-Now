package com.repairnow.partner

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

/**
 * MainActivity.kt — Repair Now Partner App
 *
 * The single Activity that hosts the React Native JavaScript bundle.
 * Components name must match AppRegistry.registerComponent in index.js.
 */
class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "RepairNowPartner"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
