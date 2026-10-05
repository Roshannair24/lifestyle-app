import { useMemo, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { API_URL } from "@/lib/url";

type ThemeColors = ReturnType<typeof useTheme>;

type Field = "email" | "password" | "confirm";

function validate(values: Record<Field, string>) {
  const errors: Partial<Record<Field, string>> = {};

  if (!values.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "Enter a valid email address";

  if (!values.password) errors.password = "Password is required";
  else if (values.password.length < 8)
    errors.password = "Password must be at least 8 characters";
  else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password))
    errors.password = "Use at least one letter and one number";

  if (!values.confirm) errors.confirm = "Please confirm your password";
  else if (values.confirm !== values.password)
    errors.confirm = "Passwords do not match";

  return errors;
}

export default function Register() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [values, setValues] = useState({
    email: "",
    password: "",
    confirm: "",
  });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const errors = validate(values);
  const showError = (f: Field) => (touched[f] || submitted) && errors[f];

  const onChange = (f: Field) => (text: string) => {
    setValues((v) => ({ ...v, [f]: text }));
    setServerError(null);
  };

  async function onSubmit() {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setServerError(null);
    try {
      const url = `${API_URL}/user/register`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email.trim().toLowerCase(),
          password: values.password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setServerError(
          data?.error?.message ?? "Registration failed. Please try again.",
        );
        return;
      }

      router.push({
        pathname: "/verify",
        params: {
          email: values.email.trim(),
          expiresInSeconds: data?.data?.expiresInSeconds,
          resendAfterSeconds: data?.data?.resendAfterSeconds,
        },
      });
    } catch {
      setServerError(
        "Can't reach the server. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <Image
            source={require("@/assets/images/pp-logo.png")}
            style={styles.heroLogo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />

          <Text style={styles.brandName}>PadosiPro</Text>
        </View>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>
          Enter your mobile number and email. We'll send the OTP to your email.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, showError("email") && styles.inputError]}
          value={values.email}
          onChangeText={onChange("email")}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />

        <Text style={styles.label}>Password</Text>
        <View>
          <TextInput
            style={[styles.input, showError("password") && styles.inputError]}
            value={values.password}
            onChangeText={onChange("password")}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            placeholder="At least 8 characters"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            textContentType="newPassword"
          />
          <Pressable
            style={styles.toggle}
            onPress={() => setShowPassword((s) => !s)}
          >
            <Text style={styles.toggleText}>
              {showPassword ? "Hide" : "Show"}
            </Text>
          </Pressable>
        </View>
        {showError("password") && (
          <Text style={styles.error}>{errors.password}</Text>
        )}

        <Text style={styles.label}>Confirm password</Text>
        <TextInput
          style={[styles.input, showError("confirm") && styles.inputError]}
          value={values.confirm}
          onChangeText={onChange("confirm")}
          onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
          placeholder="Re-enter your password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        {showError("confirm") && (
          <Text style={styles.error}>{errors.confirm}</Text>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            (loading || pressed) && { opacity: 0.8 },
          ]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create account</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push("/login")} style={styles.linkRow}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.link}>Log in</Text>
          </Text>
        </Pressable>
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
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: Platform.select({ ios: "System", android: "Roboto" }),
      marginTop: 6,
      marginBottom: 24,
    },
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

    error: { color: theme.error, fontSize: 13, marginTop: 4 },
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

    // heroLogo: {
    //   width: "100%",
    //   height: 80,
    //   alignSelf: "center",
    //   marginBottom: 24,
    // },
    brand: {
      alignItems: "center",
      marginBottom: 24,
    },
    heroLogo: {
      width: 80,
      height: 80,
      marginBottom: 6,
    },
    brandName: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
  });
