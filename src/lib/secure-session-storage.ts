import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupportedStorage } from "@supabase/supabase-js";
import * as aesjs from "aes-js";
import * as SecureStore from "expo-secure-store";

/**
 * Session storage for supabase-js on iOS/Android.
 *
 * SecureStore caps values at 2 048 bytes, which a session exceeds. So a random AES key lives in
 * SecureStore and the session itself is stored AES-CTR encrypted in AsyncStorage (the pattern
 * Supabase documents). Requires `react-native-get-random-values` to be imported first.
 */
export class LargeSecureStore implements SupportedStorage {
  private async encrypt(key: string, value: string) {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async decrypt(key: string, value: string) {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) return null;

    const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(encryptionKeyHex), new aesjs.Counter(1));
    return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)));
  }

  async getItem(key: string) {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;

    try {
      return await this.decrypt(key, encrypted);
    } catch {
      // A value written before encryption was introduced (or a lost key): treat as signed out.
      return null;
    }
  }

  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, await this.encrypt(key, value));
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }
}
