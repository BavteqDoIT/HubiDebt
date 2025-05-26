import { useContext, useState } from "react";
import LoadingOverlay from "../components/ui/LoadingOverlay";
import { Alert } from "react-native";
import { AuthContext } from "../.expo/store/auth-context";

function LoginScreen() {
  const [isAuthenticationg, setIsAuthenticating] = useState(false);

  const authCtx = useContext(AuthContext);

  async function loginHandler({ email, password }) {
    setIsAuthenticating(true);
    try {
      const token = await login(email, password);
      authCtx.authenticate(token);
    } catch (error) {
      Alert.alert(
        "Authentication failed!",
        "Could not log you in. Please check your credentials or try again later!"
      );
    }

    setIsAuthenticating(false);
  }

  if (isAuthenticationg) {
    return <LoadingOverlay message="Logging you in..." />;
  }

  return <AuthContext isLogin onAuthenticate={loginHandler} />;
}

export default LoginScreen;
