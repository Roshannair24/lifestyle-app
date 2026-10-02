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

export default function Login() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  type FieldErrors = { email?: string; password?: string };

  const params = useLocalSearchParams<{ email?: string; verified?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const justVerified = params.verified === "1";
  async function handleLogin() {}

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to continue to PadosiPro</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, fieldErrors.email && styles.inputError]}
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (fieldErrors.email)
              setFieldErrors((f) => ({ ...f, email: undefined }));
          }}
          placeholder="you@example.com"
          placeholderTextColor={theme.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          editable={!submitting}
        />
        {fieldErrors.email && (
          <Text style={styles.fieldError}>{fieldErrors.email}</Text>
        )}

        <Text style={styles.label}>Password</Text>
        <View
          style={[
            styles.passwordRow,
            fieldErrors.password && styles.inputError,
          ]}
        >
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (fieldErrors.password)
                setFieldErrors((f) => ({ ...f, password: undefined }));
            }}
            placeholder="Your password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            editable={!submitting}
          />
          <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={10}>
            <Text style={styles.toggle}>{showPassword ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>
        {fieldErrors.password && (
          <Text style={styles.fieldError}>{fieldErrors.password}</Text>
        )}

        {formError && <Text style={styles.formError}>{formError}</Text>}

        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <Text style={styles.buttonText}>Log in</Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.muted}>New to PadosiPro? </Text>
          <Pressable
            onPress={() => router.replace("/register")}
            disabled={submitting}
          >
            <Text style={styles.link}>Create an account</Text>
          </Pressable>
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
  });
