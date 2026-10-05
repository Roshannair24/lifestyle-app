import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = 3000;

function getDevHost() {
  // e.g. "192.168.29.241:8081" -> "192.168.29.241"
  const host = Constants.expoConfig?.hostUri?.split(":")[0];

  if (!host) {
    // No Metro host info: fall back to emulator defaults
    return Platform.OS === "android" ? "10.0.2.2" : "localhost";
  }

  // If Metro was started in localhost mode, the Android emulator
  // can't use "localhost" (that's the emulator itself)
  if (host === "localhost" && Platform.OS === "android") return "10.0.2.2";

  return host;
}

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${getDevHost()}:${API_PORT}`;