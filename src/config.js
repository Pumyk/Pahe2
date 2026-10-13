import { Platform } from 'react-native';
import Constants from 'expo-constants';

const PORT = 3000;

/**
 * "localhost" inside a phone or emulator points at the device itself, not your
 * computer. This picks a host that reaches the machine running the backend:
 *  - Expo dev server host (your computer's LAN IP) for physical devices / Expo Go
 *  - 10.0.2.2 for the Android emulator fallback
 *  - localhost for iOS simulator / web
 *
 * Your backend must listen on 0.0.0.0 (not only 127.0.0.1) for LAN access.
 * To hard-code a host, set OVERRIDE_HOST, e.g. '192.168.1.20'.
 */
const OVERRIDE_HOST = null;

function resolveHost() {
  if (OVERRIDE_HOST) return OVERRIDE_HOST;

  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.20:8081"
  if (hostUri) return hostUri.split(':')[0];

  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

export const API_BASE = `http://${resolveHost()}:${PORT}`;
