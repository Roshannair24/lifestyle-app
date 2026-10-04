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
  Modal,
} from "react-native";
import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  type ComponentProps,
} from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { useFocusEffect } from "expo-router/build/react-navigation";
import { API_URL } from "@/lib/url";
import { getToken } from "@/lib/auth-storage";
import { Feather } from "@expo/vector-icons";

type ThemeColors = ReturnType<typeof useTheme>;

export default function TaskSelectionScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditing = mode === "edit";

  type Task = { id: number | string; name: string; description: string };
  type Category = {
    id: number | string;
    name: string;
    description?: string; // optional
    tasks: Task[];
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const groupTasks = (
    rows: [
      {
        category_id: number;
        category_name: string;
        description: string;
        id: number;
        name: string;
      },
    ],
  ) => {
    const groups = new Map();

    for (const row of rows) {
      let category = groups.get(row.category_id);
      if (!category) {
        category = { id: row.category_id, name: row.category_name, tasks: [] };
        groups.set(row.category_id, category);
      }
      category.tasks.push({
        id: row.id,
        name: row.name,
        description: row.description,
      });
    }

    // Categories in ID order (Home Maintenance first), tasks A–Z inside each
    return [...groups.values()]
      .sort((a, b) => Number(a.id) - Number(b.id))
      .map((c) => ({
        ...c,
        tasks: [...c.tasks].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  };

  const fetchCatalogue = async () => {
    try {
      const token = await getToken();
      const url = `${API_URL}/data/list-tasks`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      console.log({ data }, { depth: null });

      return data?.data ?? [];
    } catch (e) {
      // Handle error
      console.log(e);
    }
  };

  const fetchUserTasks = async () => {
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
      return data?.data ?? [];
    } catch (e) {
      console.log(e);
      return [];
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        const [catalogue, myTasks] = await Promise.all([
          fetchCatalogue(),
          fetchUserTasks(),
        ]);

        if (isActive) {
          const grouped = groupTasks(catalogue);
          const myTaskIds: string[] = myTasks.map((t: { id: number }) =>
            String(t.id),
          );

          setCategories(grouped);
          setSelected(new Set(myTaskIds));

          setExpanded(
            new Set(
              grouped
                .filter((c) =>
                  c.tasks.some((t: Task) => myTaskIds.includes(String(t.id))),
                )
                .map((c) => String(c.id)),
            ),
          );
        }
      };

      load();

      return () => {
        isActive = false; // ignore results if the screen loses focus first
      };
    }, []),
  );
  const searchTerm = query.trim().toLowerCase();
  const visibleTasks = useMemo(() => {
    return categories
      .map((c) => {
        const tasks = c.tasks;
        return { category: c, tasks };
      })
      .filter((v) => v.tasks.length > 0);
  }, [categories]); //searchTerm

  function handleBack() {
    router.replace("/home");
  }

  function toggleExpanded(categoryId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  function toggleTask(taskId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  type IconName = ComponentProps<typeof Feather>["name"];

  // Picks an icon for each category chip based on its name
  function categoryIcon(name: string): IconName {
    const n = name.toLowerCase();
    if (n.includes("errand")) return "check-square";
    if (n.includes("home")) return "home";
    if (n.includes("travel")) return "map-pin";
    if (n.includes("health") || n.includes("medical")) return "heart";
    if (n.includes("senior") || n.includes("elder")) return "users";
    if (n.includes("event")) return "calendar";
    return "grid";
  }

  function categorySummary(c: Category) {
    return (
      c.description ??
      c.tasks
        .slice(0, 4)
        .map((t) => t.name)
        .join(", ")
    );
  }

  // Selected tasks grouped by category, for the confirm step
  const selectedGroups = useMemo(
    () =>
      categories
        .map((c) => ({
          ...c,
          tasks: c.tasks.filter((t) => selected.has(String(t.id))),
        }))
        .filter((c) => c.tasks.length > 0),
    [categories, selected],
  );

  async function save() {
    console.log({ selected });

    setSaving(true);
    setSaveError(null);

    try {
      const token = await getToken();

      console.log({ token });

      const url = `${API_URL}/user/save-user-tasks`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskIds: [...selected],
        }),
      });

      const data = await res.json().catch(() => ({}));

      setConfirmOpen(false);

      // if (isEditing)
      //   router.back();
      // else router.replace("/home");

      router.back();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setSaving(false);
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
        <Pressable style={styles.backRow} onPress={handleBack} hitSlop={10}>
          <Feather name="chevron-left" size={20} color={theme.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>What do you need help with?</Text>

        {visibleTasks?.map(({ category, tasks }) => {
          const categoryId = String(category.id);

          const isOpen = searchTerm !== "" || expanded.has(categoryId);
          const allIds = category.tasks.map((t) => String(t.id));
          const selectedCount = allIds.filter((id) => selected.has(id)).length;
          const isActive = isOpen || selectedCount > 0;
          return (
            <View
              key={categoryId}
              style={[styles.categoryCard, isOpen && styles.categoryCardOpen]}
            >
              {/* Category header: tap to expand / collapse */}
              <Pressable
                style={styles.categoryHeader}
                onPress={() => toggleExpanded(categoryId)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
              >
                <View
                  style={[styles.iconBox, isActive && styles.iconBoxActive]}
                >
                  <Feather
                    name={categoryIcon(category.name)}
                    size={20}
                    color={isActive ? theme.surface : theme.primary}
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                  <Text style={styles.categoryDesc}>
                    {categorySummary(category)}
                  </Text>
                  {!isOpen && selectedCount > 0 && (
                    <Text style={styles.selectedBadge}>
                      {selectedCount} selected
                    </Text>
                  )}
                </View>
              </Pressable>

              {isOpen && (
                <View>
                  {tasks?.map((task) => {
                    const taskId = String(task.id);
                    const checked = selected.has(taskId);
                    return (
                      <Pressable
                        key={taskId}
                        style={[
                          styles.optionCard,
                          checked && styles.optionCardChecked,
                        ]}
                        onPress={() => toggleTask(taskId)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked }}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            checked && styles.checkboxChecked,
                          ]}
                        >
                          {checked && (
                            <Feather
                              name="check"
                              size={14}
                              color={theme.surface}
                            />
                          )}
                        </View>
                        <View style={styles.flex1}>
                          <Text style={styles.optionTitle}>{task.name}</Text>
                          <Text style={styles.optionDesc}>
                            {task.description}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      {/* Footer */}
      <View style={styles.footer}>
        {selected.size > 0 && (
          <Text style={styles.footerCount}>
            {selected.size} service{selected.size === 1 ? "" : "s"} selected
          </Text>
        )}
        <Pressable
          style={[
            styles.button,
            styles.fullWidth,
            selected.size === 0 && styles.buttonDisabled,
          ]}
          disabled={selected.size === 0}
          onPress={() => {
            setSaveError(null);
            setConfirmOpen(true);
          }}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>

      {/* Confirm step */}
      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!saving) setConfirmOpen(false);
        }}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Confirm your services</Text>
            <Text style={styles.sheetSubtitle}>
              Your Lifestyle Manager will start with these. You can change them
              later.
            </Text>

            <ScrollView style={styles.sheetList}>
              {selectedGroups.map((group) => (
                <View key={String(group.id)} style={styles.sheetGroup}>
                  <Text style={styles.sheetGroupTitle}>{group.name}</Text>
                  {group.tasks.map((t) => (
                    <Text key={String(t.id)} style={styles.sheetItem}>
                      • {t.name}
                    </Text>
                  ))}
                </View>
              ))}
            </ScrollView>

            {saveError && <Text style={styles.error}>{saveError}</Text>}

            <View style={styles.sheetButtons}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setConfirmOpen(false)}
                disabled={saving}
              >
                <Text style={styles.secondaryButtonText}>Go back</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  styles.flex1,
                  saving && styles.buttonDisabled,
                ]}
                onPress={save}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={theme.surface} />
                ) : (
                  <Text style={styles.buttonText}>Confirm</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-start",
      marginBottom: 28,
    },
    flex1: { flex: 1 },
    backText: { fontSize: 16, fontWeight: "600", color: theme.primary },
    categoryHeader: { flexDirection: "row", alignItems: "center", gap: 18 },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    iconBoxActive: { backgroundColor: theme.primary },
    categoryTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 6,
    },
    categoryDesc: { fontSize: 15, color: theme.textSecondary, lineHeight: 22 },
    selectedBadge: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.primary,
      marginTop: 6,
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
    },
    optionCardChecked: { borderColor: theme.primary },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 3,
    },
    optionDesc: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },

    footer: {
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 14,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.background,
      gap: 8,
    },
    footerCount: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
    },
    button: {
      backgroundColor: theme.primary,
      borderRadius: 10,
      paddingVertical: 16,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonDisabled: { opacity: 0.45 },
    buttonText: { color: theme.surface, fontSize: 16, fontWeight: "600" },

    fullWidth: { alignSelf: "stretch" },

    // backdrop: {
    //   flex: 1,
    //   justifyContent: "flex-end",
    //   backgroundColor: "rgba(0,0,0,0.4)",
    // },
    // sheet: {
    //   backgroundColor: theme.background,
    //   borderTopLeftRadius: 20,
    //   borderTopRightRadius: 20,
    //   padding: 24,
    //   maxHeight: "80%",
    // },

    backdrop: {
      flex: 1,
      justifyContent: "center", // centers vertically (was "flex-end")
      padding: 24, // space between the dialog and the screen edges
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    sheet: {
      backgroundColor: theme.background,
      borderRadius: 20, // all four corners rounded
      padding: 24,
      maxHeight: "80%",
    },

    sheetTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 6,
    },
    sheetSubtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 22,
      marginBottom: 16,
    },
    sheetList: { marginBottom: 12 },
    sheetGroup: { marginBottom: 12 },
    sheetGroupTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 4,
    },
    sheetItem: { fontSize: 15, color: theme.text, lineHeight: 24 },
    error: {
      color: theme.error,
      fontSize: 14,
      marginBottom: 12,
      textAlign: "center",
    },
    sheetButtons: { flexDirection: "row", gap: 12 },
    secondaryButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingVertical: 16,
      alignItems: "center",
      backgroundColor: theme.surface,
    },
    secondaryButtonText: { color: theme.text, fontSize: 16, fontWeight: "600" },

    // headerRow: {
    //   flexDirection: "row",
    //   alignItems: "center",
    //   justifyContent: "space-between",
    //   gap: 12,
    //   marginBottom: 36,
    // },
    // greeting: { flex: 1, fontSize: 24, fontWeight: "600", color: theme.text },
    // banner: {
    //   padding: 10,
    //   borderRadius: 8,
    //   color: theme.error,
    //   borderWidth: 1,
    //   borderColor: theme.border,
    //   fontSize: 14,
    //   marginBottom: 16,
    // },

    // browseRow: {
    //   flexDirection: "row",
    //   alignItems: "center",
    //   gap: 8,
    //   marginTop: 20,
    //   alignSelf: "flex-start",
    // },
    // browseText: { fontSize: 15, fontWeight: "600", color: theme.primary },

    // flex1: { flex: 1 },

    // header: {
    //   flexDirection: "row",
    //   alignItems: "flex-start",
    //   gap: 12,
    //   paddingHorizontal: 20,
    //   paddingTop: 16,
    //   paddingBottom: 8,
    //   backgroundColor:"red"
    // },

    container: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
      backgroundColor: theme.background,
    },

    categoryCard: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    categoryCardOpen: {
      backgroundColor: theme.primarySoft,
      borderColor: theme.primary,
      borderLeftWidth: 4,
      borderLeftColor: theme.accent,
    },

    // text: {
    //   color: "#fff",
    // },
    title: { fontSize: 26, fontWeight: "700", color: theme.text },
    // subtitle: {
    //   fontSize: 15,
    //   color: theme.textSecondary,
    //   marginTop: 6,
    //   marginBottom: 24,
    // },
    // email: { color: theme.text, fontWeight: "600" },
    // // error: { color: theme.error, marginTop: 10, fontSize: 14 },
    // error: { color: theme.error, fontSize: 13, marginTop: 4 },
    // info: { color: theme.success, marginTop: 10, fontSize: 14 },
    // label: {
    //   fontSize: 14,
    //   fontWeight: "600",
    //   color: theme.text,
    //   marginTop: 14,
    //   marginBottom: 6,
    // },
    // input: {
    //   borderWidth: 1,
    //   borderColor: theme.border,
    //   borderRadius: 10,
    //   paddingHorizontal: 14,
    //   paddingVertical: 12,
    //   fontSize: 16,
    //   color: theme.text,
    // },
    // inputError: { borderColor: theme.error },
    // buttonDisabled: { opacity: 0.5 },

    // toggle: {
    //   position: "absolute",
    //   right: 12,
    //   top: 0,
    //   bottom: 0,
    //   justifyContent: "center",
    // },
    // toggleText: { color: theme.primary, fontWeight: "600" },

    // button: {
    //   backgroundColor: theme.primary,
    //   borderRadius: 10,
    //   paddingVertical: 14,
    //   alignItems: "center",
    //   marginTop: 28,
    // },

    // buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    // linkRow: { marginTop: 20, alignItems: "center" },
    // linkText: { color: theme.textSecondary, fontSize: 14 },
    // link: { color: theme.primary, fontWeight: "600" },
    // resendRow: {
    //   flexDirection: "row",
    //   justifyContent: "center",
    //   marginTop: 20,
    // },
    // muted: { color: theme.textSecondary, fontSize: 14 },
    // fieldError: { color: theme.error, fontSize: 13, marginTop: 6 },
    // passwordRow: {
    //   flexDirection: "row",
    //   alignItems: "center",
    //   borderWidth: 1,
    //   borderColor: theme.border,
    //   borderRadius: 10,
    //   paddingRight: 14,
    // },
    // passwordInput: {
    //   flex: 1,
    //   paddingHorizontal: 14,
    //   paddingVertical: 12,
    //   fontSize: 16,
    //   color: theme.text,
    // },
    // formError: {
    //   color: theme.error,
    //   fontSize: 14,
    //   marginTop: 16,
    //   textAlign: "center",
    // },
    // footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
    // mobileRow: {
    //   flexDirection: "row",
    //   alignItems: "center",
    //   borderWidth: 1,
    //   borderColor: theme.border,
    //   borderRadius: 10,
    // },
    // prefix: {
    //   paddingHorizontal: 14,
    //   fontSize: 16,
    //   color: theme.text,
    //   borderRightWidth: 1,
    //   borderRightColor: theme.border,
    //   paddingVertical: 12,
    // },
    // mobileInput: {
    //   flex: 1,
    //   paddingHorizontal: 12,
    //   paddingVertical: 12,
    //   fontSize: 16,
    //   color: theme.text,
    // },
    // optional: { fontWeight: "400", color: theme.textSecondary },
    // logout: { alignItems: "center", marginTop: 20 },
    // multiline: { minHeight: 90 },
  });
