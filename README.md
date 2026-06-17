# MonsoonWatch — React Native Weather App

A full-featured monsoon weather tracker for Android (Google Play) and iOS (App Store),
built with React Native + WebView.

---

## Project Structure

```
MonsoonWatch/
├── App.tsx                        # Root navigation shell
├── index.js                       # RN entry point
├── package.json
├── metro.config.js                # Includes .html asset extension
├── tsconfig.json
├── babel.config.js
├── src/
│   ├── assets/
│   │   └── monsoon_weather_tracker.html   # ← the full weather app UI
│   ├── screens/
│   │   ├── WeatherScreen.tsx      # WebView wrapper + RN bridge
│   │   └── OfflineScreen.tsx      # No-network fallback
├── android/
│   ├── app/
│   │   ├── build.gradle
│   │   ├── proguard-rules.pro
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/monsoonwatch/
│   │       │   ├── MainActivity.java
│   │       │   └── MainApplication.java
│   │       └── res/
│   │           ├── drawable/launch_screen.xml
│   │           ├── values/{strings,styles,colors}.xml
│   │           └── xml/network_security_config.xml
│   ├── build.gradle
│   ├── settings.gradle
│   └── gradle.properties
└── ios/
    ├── Info.plist
    └── Podfile
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| Java JDK | 17 |
| Android Studio | Hedgehog or later |
| Xcode (iOS) | 15+ |
| Ruby (iOS) | 3.x (for CocoaPods) |
| React Native CLI | 0.73.x |

---

## Quick Start

### 1. Install dependencies

```bash
cd MonsoonWatch
npm install
```

### 2. Android

```bash
# Start Metro
npm start

# Run on emulator or device
npm run android
```

### 3. iOS

```bash
cd ios && pod install && cd ..
npm run ios
```

---

## How the WebView Bridge Works

The app loads `src/assets/monsoon_weather_tracker.html` as a local file asset
(no server required). Two-way communication is set up at load time:

**React Native → WebView**
```ts
webViewRef.current?.postMessage(JSON.stringify({ type: 'LOCATION', city: 'Phoenix, AZ' }))
```

**WebView → React Native**
```js
window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_URL', payload: { url } }))
```

Message types handled:

| Type | Direction | Purpose |
|---|---|---|
| `LOCATION` | RN → Web | Auto-fill city from GPS |
| `NETWORK_STATUS` | RN → Web | Show/hide offline banner |
| `OPEN_URL` | Web → RN | Intercept external link taps |

---

## Copying the HTML Asset to Android

Android requires HTML assets in `android/app/src/main/assets/`.
Add this task to `android/app/build.gradle` to copy automatically at build time:

```groovy
task copyWebAssets(type: Copy) {
    from '../../src/assets'
    into 'src/main/assets'
    include '*.html'
}
preBuild.dependsOn copyWebAssets
```

Or copy manually before building:
```bash
mkdir -p android/app/src/main/assets
cp src/assets/monsoon_weather_tracker.html android/app/src/main/assets/
```

---

## Building a Release APK / AAB for Google Play

### 1. Generate a signing keystore (one-time)

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore monsoon-upload-key.keystore \
  -alias monsoon-key-alias \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

Store the keystore somewhere safe — **never commit it to git**.

### 2. Set credentials in `~/.gradle/gradle.properties`

```properties
MONSOON_UPLOAD_STORE_FILE=/absolute/path/to/monsoon-upload-key.keystore
MONSOON_UPLOAD_STORE_PASSWORD=yourStorePassword
MONSOON_UPLOAD_KEY_ALIAS=monsoon-key-alias
MONSOON_UPLOAD_KEY_PASSWORD=yourKeyPassword
```

### 3. Uncomment the signing config in `android/app/build.gradle`

```groovy
signingConfig signingConfigs.release
```

### 4. Build the AAB (recommended for Play Store)

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### 5. (Optional) Build APK instead

```bash
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## Google Play Store Submission Checklist

- [ ] App icon — 512×512 PNG in `android/app/src/main/res/mipmap-*`
- [ ] Feature graphic — 1024×500 PNG
- [ ] Screenshots — at least 2 phone screenshots (16:9 or 9:16)
- [ ] Short description (max 80 chars)
- [ ] Full description
- [ ] Privacy policy URL (required — app uses location data)
- [ ] Content rating questionnaire completed
- [ ] Target audience: General (no children's content)
- [ ] Data safety form: location (precise, optional), no data sold
- [ ] `versionCode` incremented in `android/app/build.gradle` for each upload
- [ ] AAB signed with upload key
- [ ] Release track: Internal → Closed testing → Production

---

## Permissions Explanation (for Play Store data safety form)

| Permission | Used for | Required |
|---|---|---|
| `ACCESS_FINE_LOCATION` | Auto-detect city for weather | Optional |
| `ACCESS_COARSE_LOCATION` | Fallback location | Optional |
| `INTERNET` | Fetch weather data | Required |
| `ACCESS_NETWORK_STATE` | Offline detection | Required |
| `POST_NOTIFICATIONS` | Storm alerts | Optional |

---

## Customization

### Add real weather API data
Replace the `weatherDB` object in `monsoon_weather_tracker.html` with calls to:
- **NWS API** (free, US only): `https://api.weather.gov/points/{lat},{lon}`
- **OpenWeatherMap** (free tier): `https://api.openweathermap.org/data/2.5/weather`
- **Tomorrow.io** (free tier): real-time monsoon + lightning data

### Add push notifications for storm alerts
Integrate `@react-native-firebase/messaging` and trigger alerts when
the weather bridge receives a CAPE index > 1500 or lightning within 10 miles.

### Add radar tiles
Replace the Canvas radar with real NEXRAD radar tiles from:
- `https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi` (free)
- `https://opengeo.ncep.noaa.gov/geoserver/conus/conus_bref_raw/ows` (NWS)

---

## License

MIT © MonsoonWatch 2025
