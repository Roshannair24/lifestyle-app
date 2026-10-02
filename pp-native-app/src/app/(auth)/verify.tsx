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

export default function Verify() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { email } = useLocalSearchParams<{ email: string }>();

  const RESEND_COOLDOWN = 30;

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN);

  const canSubmit = /^\d{6}$/.test(code) && !verifying;

  // Resend countdown: ticks once per second until it reaches 0
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function formatTime(s: number) {
    return `0:${String(s).padStart(2, "0")}`;
  }

  async function handleVerify() {}

  async function handleResend() {}

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to <Text style={styles.email}>{email}</Text>
        </Text>

        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={code}
          onChangeText={(t) => {
            setCode(t.replace(/\D/g, "").slice(0, 6)); // digits only
            setError(null);
          }}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          onSubmitEditing={handleVerify}
          editable={!verifying}
        />

        {error && <Text style={styles.error}>{error}</Text>}
        {info && <Text style={styles.info}>{info}</Text>}

        <Pressable
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={!canSubmit}
        >
          {verifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </Pressable>

        <View style={styles.resendRow}>
          <Text style={styles.muted}>Didn't get the code? </Text>
          {secondsLeft > 0 ? (
            <Text style={styles.muted}>
              Resend in {formatTime(secondsLeft)}
            </Text>
          ) : (
            <Pressable onPress={handleResend} disabled={resending}>
              <Text style={styles.link}>
                {resending ? "Sending..." : "Resend code"}
              </Text>
            </Pressable>
          )}
        </View>
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
  });
