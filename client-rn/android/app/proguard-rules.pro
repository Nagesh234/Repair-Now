# proguard-rules.pro — Repair Now Client App
# Rules for release build minification with R8.

# React Native — keep all JS bridge interfaces
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Firebase Messaging
-keep class com.google.firebase.messaging.** { *; }

# Kotlin
-keep class kotlin.** { *; }
-keepclassmembers class **$WhenMappings { *; }
