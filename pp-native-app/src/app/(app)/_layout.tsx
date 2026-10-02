import { Stack } from "expo-router";

export default function AppLayout() {
  //   const theme = useTheme();
  //   const [status, setStatus] = useState<"checking" | "in" | "out">("checking");

  //   useEffect(() => {
  //     getToken().then((token) => setStatus(token ? "in" : "out"));
  //   }, []);

  //   if (status === "checking") {
  //     return (
  //       <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
  //         <ActivityIndicator color={theme.primary} />
  //       </View>
  //     );
  //   }

  //   if (status === "out") return <Redirect href="/login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
