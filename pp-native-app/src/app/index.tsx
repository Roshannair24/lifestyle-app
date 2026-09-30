// import { Text, View, StyleSheet, TextInput } from "react-native";

// export default function Index() {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.text}>Home screen v22</Text>

//       <Text style={styles.title}>Create your account</Text>
//       <Text style={styles.subtitle}>Sign up to get started with PadosiPro</Text>

//       <Text style={styles.label}>Email</Text>
//       {/* <TextInput
//         style={[styles.input, showError("email") && styles.inputError]}
//         value={values.email}
//         onChangeText={onChange("email")}
//         onBlur={() => setTouched((t) => ({ ...t, email: true }))}
//         placeholder="you@example.com"
//         keyboardType="email-address"
//         autoCapitalize="none"
//         autoComplete="email"
//         textContentType="emailAddress"
//       /> */}
//     </View>
//   );
// }

// const COLORS = {
//   primary: "#1f5f4a", // placeholder: match to app.padosipro.com
//   text: "#1a1a1a",
//   muted: "#6b7280",
//   border: "#d1d5db",
//   error: "#dc2626",
//   bg: "#ffffff",
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#25292e",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   text: {
//     color: "#fff",
//   },
//   title: { fontSize: 26, fontWeight: "700", color: COLORS.text },
//   subtitle: { fontSize: 15, color: COLORS.muted, marginTop: 6, marginBottom: 24 },
//   label: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: COLORS.text,
//     marginTop: 14,
//     marginBottom: 6,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     borderRadius: 10,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: COLORS.text,
//   },
// });
 import { Redirect } from "expo-router";
   export default function Index() {
     return <Redirect href="/register" />;
   }