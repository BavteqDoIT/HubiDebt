// screens/SignupScreen.js
import { useContext, useState } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';

import AuthContent from '../components/Auth/AuthContent';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { AuthContext } from '../store/auth-context';
import { createUser } from '../util/auth'; // Importujemy tylko createUser dla SignupScreen

// Twój URL bazy danych
const databaseUrl = 'https://hubidebt-default-rtdb.europe-west1.firebasedatabase.app/';

function SignupScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const authCtx = useContext(AuthContext);

  async function authHandler({ email, password }) {
    setIsAuthenticating(true);
    try {
      // Dla SignupScreen zawsze wywołujemy createUser
      const { token, uid, userEmail } = await createUser(email, password);

      // Zapisz email w bazie danych Firebase Realtime Database
      await axios.patch(`${databaseUrl}users/${uid}.json?auth=${token}`, {
        email: userEmail
      });

      // Uwierzytelnij w kontekście
      authCtx.authenticate(token, uid, userEmail);

    } catch (error) {
      Alert.alert(
        'Authentication failed!',
        error.message || 'Could not create user. Please check your credentials or try again later!'
      );
      setIsAuthenticating(false);
    }
  }

  if (isAuthenticating) {
    // Dla SignupScreen zawsze wyświetlamy "Creating user..."
    return <LoadingOverlay message="Creating user..." />;
  }

  // Dla SignupScreen nie przekazujemy propsu isLogin lub przekazujemy isLogin={false}
  return <AuthContent onAuthenticate={authHandler} />;
}

export default SignupScreen;