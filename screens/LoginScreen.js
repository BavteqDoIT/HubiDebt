import { useContext, useState } from 'react';
import { Alert, StyleSheet, Text, View, ActivityIndicator } from 'react-native'; // Dodaj ActivityIndicator i Text
import { AuthContext } from '../store/auth-context';
import { login } from '../util/auth'; // Upewnij się, że importujesz 'login'
import AuthContent from '../components/Auth/AuthContent';
import { Colors } from '../constants/styles'; // Upewnij się, że masz Colors

function LoginScreen() {
  const authCtx = useContext(AuthContext);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  async function submitHandler({ email, password }) { // Odbierasz tylko email i password
    setIsAuthenticating(true);

    try {
      const { token, uid, userEmail } = await login(email, password); // Wywołujesz login i odbierasz pełne dane
      authCtx.authenticate(token, uid, userEmail); // Przekazujesz PEŁNE DANE do kontekstu
    } catch (error) {
      Alert.alert(
        'Błąd Logowania!',
        'Nie udało się zalogować. Sprawdź swoje dane lub spróbuj ponownie później.'
      );
      setIsAuthenticating(false);
    }
  }

  if (isAuthenticating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary500} />
        <Text style={styles.loadingText}>Logowanie...</Text>
      </View>
    );
  }

  return <AuthContent isLogin onAuthenticate={submitHandler} />;
}

export default LoginScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.primary800,
  },
});