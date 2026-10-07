import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface TokenCache {
  getToken: (key: string) => Promise<string | null>;
  saveToken: (key: string, token: string) => Promise<void>;
  clearToken?: (key: string) => Promise<void> | void;
}

export const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string): Promise<string | null> => {
      try {
        if (Platform.OS === 'web') {
          return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        }
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.error('Failed to get token from SecureStore:', error);
        return null;
      }
    },
    saveToken: async (key: string, token: string): Promise<void> => {
      try {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            localStorage.setItem(key, token);
          }
          return;
        }
        await SecureStore.setItemAsync(key, token);
      } catch (error) {
        console.error('Failed to save token to SecureStore:', error);
      }
    },
    clearToken: async (key: string): Promise<void> => {
      try {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
          }
          return;
        }
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error('Failed to delete token from SecureStore:', error);
      }
    },
  };
};

export const tokenCache = createTokenCache();
