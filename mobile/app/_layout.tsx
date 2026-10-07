import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '../lib/tokenCache';
import { setAuthTokenGetter } from '../services/api/client';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function AuthTokenBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(async () => {
      try {
        return await getToken();
      } catch (err) {
        console.warn('Failed to retrieve Clerk token:', err);
        return null;
      }
    });
  }, [getToken]);

  return null;
}

export default function RootLayout() {
  if (!publishableKey) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in mobile/.env
          </Text>
        </View>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="place/[id]" options={{ title: 'Place Details' }} />
          <Stack.Screen name="add-place" options={{ presentation: 'modal', title: 'Add Place' }} />
        </Stack>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthTokenBridge />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="place/[id]" options={{ title: 'Place Details' }} />
          <Stack.Screen name="add-place" options={{ presentation: 'modal', title: 'Add Place' }} />
        </Stack>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF3C7',
    paddingTop: 48,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  bannerText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
