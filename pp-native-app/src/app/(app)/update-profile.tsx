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

type Values = {
  name: string;
  mobile: string;
  address: string;
  businessName: string;
};
type FieldName = keyof Values;
type Errors = Partial<Record<FieldName, string>>;

const MOBILE_REGEX = /^[6-9]\d{9}$/; // Indian mobile numbers start with 6, 7, 8 or 9

function validate(v: Values): Errors {
  const e: Errors = {};
  const name = v.name.trim();
  const address = v.address.trim();
  const business = v.businessName.trim();

  if (!name) e.name = "Name is required";
  else if (name.length < 2) e.name = "Name must be at least 2 characters";
  else if (name.length > 100) e.name = "Name must be under 100 characters";

  if (!v.mobile) e.mobile = "Mobile number is required";
  else if (!MOBILE_REGEX.test(v.mobile))
    e.mobile = "Enter a valid 10-digit Indian mobile number";

  if (!address) e.address = "Address is required";
  else if (address.length < 10) e.address = "Please enter your full address";
  else if (address.length > 300)
    e.address = "Address must be under 300 characters";

  if (business.length > 100)
    e.businessName = "Business name must be under 100 characters";

  return e;
}

export default function UpdateProfile() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [values, setValues] = useState<Values>({
    name: "",
    mobile: "",
    address: "",
    businessName: "",
  });
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>(
    {},
  );
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const clientErrors = useMemo(() => validate(values), [values]);

  const errors: Errors = {
    name:
      serverErrors.name ??
      (touched.name || submitted ? clientErrors.name : undefined),
    mobile:
      serverErrors.mobile ??
      (touched.mobile || submitted ? clientErrors.mobile : undefined),
    address:
      serverErrors.address ??
      (touched.address || submitted ? clientErrors.address : undefined),
    businessName:
      serverErrors.businessName ??
      (touched.businessName || submitted
        ? clientErrors.businessName
        : undefined),
  };

  function update(field: FieldName, text: string) {
    setValues((v) => ({ ...v, [field]: text }));
    if (serverErrors[field])
      setServerErrors((s) => ({ ...s, [field]: undefined }));
  }

  async function handleSave() {}

  async function handleLogout() {}

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Tell us about you</Text>
        <Text style={styles.subtitle}>
          Your Lifestyle Manager uses these details to get things done for your
          household.
        </Text>

        {/* Name */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={values.name}
          onChangeText={(t) => update("name", t)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          placeholder="Your full name"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          editable={!saving}
        />
        {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}

        {/* Mobile Number */}
        <Text style={styles.label}>Mobile Number</Text>
        <View style={[styles.mobileRow, errors.mobile && styles.inputError]}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            style={styles.mobileInput}
            value={values.mobile}
            onChangeText={(t) =>
              update("mobile", t.replace(/\D/g, "").slice(0, 10))
            }
            onBlur={() => setTouched((t) => ({ ...t, mobile: true }))}
            placeholder="98765 43210"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            maxLength={10}
            autoComplete="tel"
            textContentType="telephoneNumber"
            editable={!saving}
          />
        </View>
        {errors.mobile && (
          <Text style={styles.fieldError}>{errors.mobile}</Text>
        )}

        {/* Address */}
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[
            styles.input,
            styles.multiline,
            errors.address && styles.inputError,
          ]}
          value={values.address}
          onChangeText={(t) => update("address", t)}
          onBlur={() => setTouched((t) => ({ ...t, address: true }))}
          placeholder="Flat, building, street, area, city, PIN"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          autoComplete="street-address"
          editable={!saving}
        />
        {errors.address && (
          <Text style={styles.fieldError}>{errors.address}</Text>
        )}

        {/* Business Name (optional) */}
        <Text style={styles.label}>
          Business Name
          <Text style={styles.optional}> (optional)</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.businessName && styles.inputError]}
          value={values.businessName}
          onChangeText={(t) => update("businessName", t)}
          onBlur={() => setTouched((t) => ({ ...t, businessName: true }))}
          placeholder="Only if you run a business"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="words"
          editable={!saving}
        />
        {errors.businessName && (
          <Text style={styles.fieldError}>{errors.businessName}</Text>
        )}

        {formError && <Text style={styles.formError}>{formError}</Text>}

        <Pressable
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <Text style={styles.buttonText}>Save and continue</Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleLogout}
          disabled={saving}
          style={styles.logout}
        >
          <Text style={styles.muted}>
            Not you? <Text style={styles.link}>Log out</Text>
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
