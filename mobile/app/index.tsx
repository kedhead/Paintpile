import { useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  BackHandler,
  Platform,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { WEBAPP_URL } from '@/constants/config';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isError, setIsError] = useState(false);

  // Handle Android hardware back button
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );
      return () => subscription.remove();
    }, [canGoBack])
  );

  const onNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to connect</Text>
          <Text style={styles.errorMessage}>
            Check your internet connection and try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setIsError(false);
              webViewRef.current?.reload();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WebView
        ref={webViewRef}
        source={{ uri: WEBAPP_URL }}
        style={styles.webview}
        onNavigationStateChange={onNavigationStateChange}
        onError={() => setIsError(true)}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          if (nativeEvent.statusCode >= 500) {
            setIsError(true);
          }
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#d4a843" />
          </View>
        )}
        // Allow inline media playback on iOS
        allowsInlineMediaPlayback
        // Allow file uploads (for paint photos etc.)
        allowsBackForwardNavigationGestures
        // Enable JavaScript
        javaScriptEnabled
        // Enable DOM storage for Firebase auth persistence
        domStorageEnabled
        // Allow mixed content for dev
        mixedContentMode="compatibility"
        // User agent suffix so the web app can detect the native shell
        applicationNameForUserAgent="PaintPile-Native"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  webview: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#18181b',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#d4a843',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#18181b',
    fontSize: 16,
    fontWeight: '600',
  },
});
