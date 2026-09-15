import { router } from "expo-router";
import { Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "@/context/session";

const LoginPage = () => {
  const { signIn } = useSession();

  const handleContinue = () => {
    signIn();
    router.replace("/");
  };

  return (
    <SafeAreaView>
      <Text>Hello world this is the login page</Text>
      <Button title="Continue to Home" onPress={handleContinue} />
    </SafeAreaView>
  );
};

export default LoginPage;
