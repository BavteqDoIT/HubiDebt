import { useContext, useState } from "react";

import { createUser } from "../util/auth";
import LoadingOverlay from "../components/ui/LoadingOverlay";
import { Alert } from "react-native";
import { AuthContext } from "../.expo/store/auth-context";

function SignupScreen() {
  const [isAuthenticationg, setIsAuthenticating] = useState(false);

  const authCtx = useContext(AuthContext);

  async function signupHandler({ email, password }) {
    setIsAuthenticating(true);
    try {
      const token = await createUser(email, password);
      authCtx.authenticate(token);
    } catch (error) {
      Alert.alert(
        "Authentication failed",
        "Could not create user, please check your input and try again later"
      );
    }

    setIsAuthenticating(false);
  }

  if (isAuthenticationg) {
    return <LoadingOverlay message="Creating user..." />;
  }

  return <AuthContext onAuthenticate={signupHandler} />;
}

export default SignupScreen;
