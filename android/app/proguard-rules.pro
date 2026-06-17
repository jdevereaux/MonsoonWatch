# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface

# Splash screen
-keep class org.devio.rn.splashscreen.** { *; }

# Geolocation
-keep class com.agontuk.RNFusedLocation.** { *; }

# NetInfo
-keep class com.reactnativecommunity.netinfo.** { *; }

# Permissions
-keep class com.zoontek.rnpermissions.** { *; }

# General Android
-keepattributes SourceFile,LineNumberTable
-dontwarn okhttp3.**
-dontwarn okio.**
