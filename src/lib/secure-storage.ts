import AsyncStorage from "@react-native-async-storage/async-storage";
import aesjs from "aes-js";
import { getRandomValues } from "expo-crypto";
import * as SecureStore from "expo-secure-store";

/**
 * Session storage for supabase-js on iOS / Android.
 *
 * SecureStore (Keychain / Keystore) caps values at 2 KB and a Supabase session
 * is larger than that, so the session itself is AES-256-CTR encrypted in
 * AsyncStorage and only the per-key encryption key lives in SecureStore.
 * This is the storage adapter Supabase recommends for Expo.
 */
export class LargeSecureStore {
  private async encrypt(key: string, value: string) {
    const encryptionKey = getRandomValues(new Uint8Array(32));
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encrypted);
  }

  private async decrypt(key: string, value: string) {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) return null;

    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1),
    );
    const decrypted = cipher.decrypt(aesjs.utils.hex.toBytes(value));
    return aesjs.utils.utf8.fromBytes(decrypted);
  }

  async getItem(key: string) {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    try {
      return await this.decrypt(key, encrypted);
    } catch {
      // The key vanished (e.g. reinstall); treat it as signed out.
      await this.removeItem(key);
      return null;
    }
  }

  async setItem(key: string, value: string) {
    const encrypted = await this.encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }
}
