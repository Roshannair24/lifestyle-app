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
import { useMemo, useState, useEffect, useCallback } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { useFocusEffect } from "expo-router/build/react-navigation";
import { API_URL } from "@/lib/url";
import { getToken } from "@/lib/auth-storage";
import { Feather } from "@expo/vector-icons";

type ThemeColors = ReturnType<typeof useTheme>;

export default function Homepage() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  type TaskRow = {
    id: number;
    name: string;
    description: string;
    category_id: number;
    category_name: string;
  };

  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myTasks, setMyTasks] = useState<TaskRow[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);

  const handleLogout = async () => {};

  const total: number = 0;
  const firstName = name?.split(" ")[0];

  const fetchUser = async () => {
    try {
      const token = await getToken();
      const url = `${API_URL}/data/get-user-profile`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
    } catch (e) {
      // Handle error
    }
  };

  const fetchUserTasks = async () => {
    setLoadingTasks(true);
    setTasksError(null);
    try {
      const token = await getToken();
      const url = `${API_URL}/data/get-user-tasks`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      console.log({ data });

      setMyTasks(data?.data ?? []);
    } catch (e) {
      setTasksError(
        "Can't reach the server. Check your connection and try again.",
      );
    } finally {
      setLoadingTasks(false);
    }
  };

  // // Runs on first open AND when returning from "Edit tasks"
  useFocusEffect(
    useCallback(() => {
      // fetchUser();
      fetchUserTasks();
    }, []),
  );

  function greeting(date = new Date()) {
    const hour = date.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  const openAccountMenu = () => {};

  function openTasks(query?: string) {
    router.push({
      pathname: "/tasks",
      // params: { mode: "edit", ...(query ? { q: query } : {}) },
    });
  }

  // Tasks sorted by category, then name
  const sortedTasks = useMemo(
    () =>
      [...myTasks].sort(
        (a, b) => a.category_id - b.category_id || a.name.localeCompare(b.name),
      ),
    [myTasks],
  );

  type RequestState = "loading" | "error" | "empty" | "list";

  let requestState: RequestState;
  if (loadingTasks && myTasks.length === 0) requestState = "loading";
  else if (tasksError && myTasks.length === 0) requestState = "error";
  else if (sortedTasks.length === 0) requestState = "empty";
  else requestState = "list";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Greeting + account */}
        <View style={styles.headerRow}>
          <Text style={styles.greeting} numberOfLines={2}>
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </Text>
          <Pressable
            onPress={openAccountMenu}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Account"
          >
            <Feather name="user" size={24} color={theme.text} />
          </Pressable>
        </View>

        {error && <Text style={styles.banner}>{error}</Text>}

        {/* Your request */}
        <Text style={styles.sectionLabel}>Your requests</Text>

        {requestState === "loading" && (
          <View style={[styles.card, styles.cardCenter]}>
            <ActivityIndicator color={theme.primary} />
          </View>
        )}

        {requestState === "error" && (
          <View style={styles.card}>
            <Text style={styles.cardSubtitle}>{tasksError}</Text>
            <Pressable
              onPress={fetchUserTasks}
              hitSlop={8}
              style={styles.inlineLink}
            >
              <Text style={styles.link}>Try again</Text>
            </Pressable>
          </View>
        )}

        {requestState === "empty" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No requests yet</Text>
            <Text style={styles.cardSubtitle}>
              Pick the services you'd like help with.
            </Text>
            <Pressable
              onPress={() => openTasks()}
              hitSlop={8}
              style={styles.inlineLink}
            >
              <Text style={styles.link}>Choose services</Text>
              <Feather name="chevron-right" size={16} color={theme.primary} />
            </Pressable>
          </View>
        )}

        {requestState === "list" && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              {/* <View style={styles.flex1}>
        <Text style={styles.cardTitle}>{requestTitle}</Text>
        <Text style={styles.cardSubtitle}>Request received</Text>
      </View> */}
              <Pressable
                onPress={() => openTasks()}
                hitSlop={10}
                style={styles.viewLink}
                accessibilityRole="button"
                accessibilityLabel="Edit your request"
              >
                <Text style={styles.link}>Edit</Text>
                <Feather name="chevron-right" size={16} color={theme.primary} />
              </Pressable>
            </View>

            <View style={styles.divider} />

            {sortedTasks.map((task) => (
              <View key={task.id} style={styles.taskRow}>
                <Feather name="check-circle" size={16} color={theme.primary} />
                <View style={styles.flex1}>
                  <Text style={styles.taskName}>{task.name}</Text>
                  <Text style={styles.taskMeta}>{task.category_name}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={styles.browseRow}
          onPress={() => openTasks()}
          hitSlop={8}
        >
          <Text style={styles.browseText}>Browse everything we do</Text>
          <Feather name="arrow-right" size={16} color={theme.primary} />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    flex1: { flex: 1 },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 36,
    },
    greeting: { flex: 1, fontSize: 24, fontWeight: "600", color: theme.text },
    banner: {
      padding: 10,
      borderRadius: 8,
      color: theme.error,
      borderWidth: 1,
      borderColor: theme.border,
      fontSize: 14,
      marginBottom: 16,
    },

    browseRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 20,
      alignSelf: "flex-start",
    },
    browseText: { fontSize: 15, fontWeight: "600", color: theme.primary },

    sectionLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 12,
    },

    container: {
      flexGrow: 1,
      // justifyContent: "center",
      padding: 24,
      paddingTop: 48,
      backgroundColor: theme.background,
    },

    card: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 20,
    },
    cardCenter: { alignItems: "center", paddingVertical: 28 },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
    cardTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    cardSubtitle: { fontSize: 15, color: theme.textSecondary },
    viewLink: { flexDirection: "row", alignItems: "center", gap: 2 },
    inlineLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      marginTop: 12,
      alignSelf: "flex-start",
    },
    link: { fontSize: 15, color: theme.primary, fontWeight: "600" },
    divider: { height: 1, backgroundColor: theme.border, marginVertical: 14 },
    taskRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingVertical: 6,
    },
    taskName: { fontSize: 15, fontWeight: "500", color: theme.text },
    taskMeta: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  });
