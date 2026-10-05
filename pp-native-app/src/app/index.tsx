import { Redirect } from "expo-router";
export default function Index() {
   return <Redirect href="/register" />;

  // return (
  //   <Redirect
  //     href={{ pathname: "/homepage", params: { email: "test@test.com" } }}
  //   />
  // );
}
