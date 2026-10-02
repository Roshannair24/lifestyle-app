import {
  Text,
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useMemo, useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/use-theme";

type ThemeColors = ReturnType<typeof useTheme>;

export default function UpdateProfile() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Home</Text>
        <Text style={styles.subtitle}>home</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
      backgroundColor: theme.background,
    },
    text: {
      color: "#fff",
    },
    title: { fontSize: 26, fontWeight: "700", color: theme.text },
    subtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      marginTop: 6,
      marginBottom: 24,
    },
    email: { color: theme.text, fontWeight: "600" },
    // error: { color: theme.error, marginTop: 10, fontSize: 14 },
    error: { color: theme.error, fontSize: 13, marginTop: 4 },
    info: { color: theme.success, marginTop: 10, fontSize: 14 },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginTop: 14,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.text,
    },
    inputError: { borderColor: theme.error },
    buttonDisabled: { opacity: 0.5 },

    toggle: {
      position: "absolute",
      right: 12,
      top: 0,
      bottom: 0,
      justifyContent: "center",
    },
    toggleText: { color: theme.primary, fontWeight: "600" },

    button: {
      backgroundColor: theme.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 28,
    },

    buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    linkRow: { marginTop: 20, alignItems: "center" },
    linkText: { color: theme.textSecondary, fontSize: 14 },
    link: { color: theme.primary, fontWeight: "600" },
    resendRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 20,
    },
    muted: { color: theme.textSecondary, fontSize: 14 },
    fieldError: { color: theme.error, fontSize: 13, marginTop: 6 },
    passwordRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingRight: 14,
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.text,
    },
    formError: {
      color: theme.error,
      fontSize: 14,
      marginTop: 16,
      textAlign: "center",
    },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
    mobileRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
    },
    prefix: {
      paddingHorizontal: 14,
      fontSize: 16,
      color: theme.text,
      borderRightWidth: 1,
      borderRightColor: theme.border,
      paddingVertical: 12,
    },
    mobileInput: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.text,
    },
    optional: { fontWeight: "400", color: theme.textSecondary },
    logout: { alignItems: "center", marginTop: 20 },
    multiline: { minHeight: 90 },
  });
