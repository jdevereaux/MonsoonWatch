import React, {useRef, useState, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  BackHandler,
} from 'react-native';
import {WebView, WebViewMessageEvent} from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import Geolocation from 'react-native-geolocation-service';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// Bundled HTML asset — served locally so the app works fully offline
// for the UI; live weather API calls originate from JS inside the WebView.
const HTML_ASSET =
  Platform.OS === 'android'
    ? {uri: 'file:///android_asset/monsoon_weather_tracker.html'}
    : require('../assets/monsoon_weather_tracker.html');

// JavaScript injected into the WebView at load time.
// Sets up a two-way bridge between RN and the web page.
const INJECTED_JS = `
(function() {
  // ── RN → Web message handler ──────────────────────────────────────────
  window.addEventListener('message', function(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.type === 'LOCATION') {
        // Auto-fill search with device location city
        var input = document.getElementById('searchInput');
        if (input && msg.city) {
          input.value = msg.city;
          if (typeof searchWeather === 'function') searchWeather();
        }
      }
      if (msg.type === 'NETWORK_STATUS') {
        var banner = document.getElementById('offlineBanner');
        if (!banner) {
          banner = document.createElement('div');
          banner.id = 'offlineBanner';
          banner.style.cssText = [
            'position:fixed;top:0;left:0;right:0;z-index:9999;',
            'background:#e53e3e;color:#fff;text-align:center;',
            'padding:6px 12px;font-size:13px;font-weight:600;',
            'display:none;'
          ].join('');
          banner.textContent = '⚠️ No internet — showing cached data';
          document.body.appendChild(banner);
        }
        banner.style.display = msg.connected ? 'none' : 'block';
      }
    } catch(err) {}
  });

  // ── Web → RN bridge ───────────────────────────────────────────────────
  // Override the global sendPrompt so taps in the app can post to RN
  window.__rnPostMessage = function(type, payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: type, payload: payload })
      );
    }
  };

  // Intercept any link clicks so RN can handle external URLs
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a[href]');
    if (a && a.href && !a.href.startsWith('javascript')) {
      e.preventDefault();
      window.__rnPostMessage('OPEN_URL', { url: a.href });
    }
  });

  true; // required — last expression must be truthy
})();
`;

interface BridgeMessage {
  type: string;
  payload?: Record<string, unknown>;
}

export default function WeatherScreen(): React.JSX.Element {
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  // ── Network monitoring ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      const connected = !!(state.isConnected && state.isInternetReachable);
      sendToWeb({type: 'NETWORK_STATUS', connected});
    });
    return () => unsub();
  }, []);

  // ── Geolocation ─────────────────────────────────────────────────────────
  useEffect(() => {
    requestLocationAndSend();
  }, []);

  const requestLocationAndSend = async () => {
    const perm =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const result = await request(perm);
    if (result !== RESULTS.GRANTED) {
      return; // Fall back to manual search
    }

    Geolocation.getCurrentPosition(
      async pos => {
        const {latitude, longitude} = pos.coords;
        // Reverse geocode using a free public API (no key needed for basic use)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {headers: {'Accept-Language': 'en'}},
          );
          const data = await res.json();
          const city =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.village ||
            'Phoenix';
          const state = data?.address?.state_code || 'AZ';
          sendToWeb({type: 'LOCATION', city: `${city}, ${state}`});
        } catch {
          // Nominatim unavailable — stay with default
        }
      },
      () => {/* Permission denied or timeout — silent */},
      {enableHighAccuracy: false, timeout: 10000, maximumAge: 60000},
    );
  };

  // ── Android back button ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      return false;
    };
    BackHandler.addEventListener('hardwareBackPress', handler);
    return () => BackHandler.removeEventListener('hardwareBackPress', handler);
  }, [canGoBack]);

  // ── Bridge helper ───────────────────────────────────────────────────────
  const sendToWeb = useCallback((msg: Record<string, unknown>) => {
    webViewRef.current?.postMessage(JSON.stringify(msg));
  }, []);

  // ── Handle messages from WebView ────────────────────────────────────────
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg: BridgeMessage = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'OPEN_URL' && msg.payload?.url) {
        // Could use Linking.openURL here if desired
        Alert.alert('External Link', String(msg.payload.url));
      }
    } catch {/* ignore malformed messages */}
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4299e1" />
          <Text style={styles.loadingText}>Loading MonsoonWatch…</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⛈️</Text>
          <Text style={styles.errorTitle}>Could not load the app</Text>
          <Text style={styles.errorSub}>
            Check that the asset is bundled correctly.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setError(false);
              setLoading(true);
              webViewRef.current?.reload();
            }}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={HTML_ASSET}
        style={[styles.webview, error && styles.hidden]}
        // Security
        originWhitelist={['*']}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        // Content
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        // Bridge
        injectedJavaScript={INJECTED_JS}
        onMessage={handleMessage}
        // Navigation state
        onNavigationStateChange={navState =>
          setCanGoBack(navState.canGoBack)
        }
        // Loading callbacks
        onLoadStart={() => {setLoading(true); setError(false);}}
        onLoadEnd={() => setLoading(false)}
        onError={() => {setError(true); setLoading(false);}}
        // Performance
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        renderLoading={() => <View />}
        // Scroll & viewport
        scrollEnabled={true}
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        // Android hardware acceleration
        androidHardwareAccelerationDisabled={false}
        // iOS
        allowsInlineMediaPlayback={true}
        // User agent branding
        applicationNameForUserAgent="MonsoonWatch/1.0"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  hidden: {
    opacity: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0f1e',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 16,
  },
  loadingText: {
    color: '#a0aec0',
    fontSize: 15,
    fontWeight: '500',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0f1e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    zIndex: 10,
  },
  errorIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#e2e8f0',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSub: {
    color: '#718096',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: '#4299e1',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
