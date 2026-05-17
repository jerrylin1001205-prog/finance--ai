import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

// ─── Fill these in after creating your Google Cloud project ──────────────────
// Guide: https://docs.expo.dev/guides/google-authentication/
export const GOOGLE_CLIENT_IDS = {
  webClientId: 'PASTE_YOUR_WEB_CLIENT_ID_HERE',
  iosClientId: 'PASTE_YOUR_IOS_CLIENT_ID_HERE',
  androidClientId: 'PASTE_YOUR_ANDROID_CLIENT_ID_HERE',
};

const USER_KEY = 'google_user';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export const saveGoogleUser = async (user: GoogleUser) => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getGoogleUser = async (): Promise<GoogleUser | null> => {
  const data = await AsyncStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearGoogleUser = async () => {
  await AsyncStorage.removeItem(USER_KEY);
};

export const fetchGoogleUserInfo = async (token: string): Promise<GoogleUser> => {
  const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Google user info');
  const data = await res.json();
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
};
