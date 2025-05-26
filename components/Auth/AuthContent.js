import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import FlatButton from '../ui/FlatButton';
import AuthForm from './AuthForm';
import { Colors } from '../../constants/styles';

function AuthContent({ isLogin, onAuthenticate }) {
  const navigation = useNavigation();

  const [credentialsInvalid, setCredentialsInvalid] = useState({
    email: false,
    password: false,
    confirmEmail: false,
    confirmPassword: false,
  });

  function switchAuthModeHandler() {
    if (isLogin) {
      navigation.replace('Signup');
    } else {
      navigation.replace('Login');
    }
  }

  function submitHandler(credentials) {
    // ZMIANA TUTAJ: Odpowiednio odbieramy zmienione nazwy kluczy
    let { email, emailConfirm, password, passwordConfirm } = credentials; // Zmieniono na emailConfirm i passwordConfirm

    email = email.trim();
    password = password.trim();

    const emailIsValid = email.includes('@');
    const passwordIsValid = password.length >= 6; // Upewnij się, że to >= 6
    const emailsAreEqual = email === emailConfirm; // Używamy emailConfirm
    const passwordsAreEqual = password === passwordConfirm; // Używamy passwordConfirm

    console.log("--- AuthContent Validation Logs ---");
    console.log("Entered Email:", email);
    console.log("Entered Password:", password);
    if (!isLogin) {
      console.log("Entered Confirm Email:", emailConfirm); // Używamy emailConfirm
      console.log("Entered Confirm Password:", passwordConfirm); // Używamy passwordConfirm
    }
    console.log("emailIsValid:", emailIsValid);
    console.log("passwordIsValid:", passwordIsValid);
    if (!isLogin) {
      console.log("emailsAreEqual:", emailsAreEqual);
      console.log("passwordsAreEqual:", passwordsAreEqual);
    }
    console.log("---------------------------------");


    if (
      !emailIsValid ||
      !passwordIsValid ||
      (!isLogin && (!emailsAreEqual || !passwordsAreEqual))
    ) {
      Alert.alert('Invalid input', 'Please check your entered credentials.');
      setCredentialsInvalid({
        email: !emailIsValid,
        confirmEmail: !emailIsValid || !emailsAreEqual, // Odniesienie do `credentialsInvalid` powinno być `confirmEmail`
        password: !passwordIsValid,
        confirmPassword: !passwordIsValid || !passwordsAreEqual, // Odniesienie do `credentialsInvalid` powinno być `confirmPassword`
      });
      return;
    }
    onAuthenticate({ email, password });
    console.log("AuthContent - submitHandler: Validation passed, calling onAuthenticate.");
  }


  return (
    <View style={styles.authContent}>
      <AuthForm
        isLogin={isLogin}
        onSubmit={submitHandler}
        credentialsInvalid={credentialsInvalid}
      />
      <View style={styles.buttons}>
        <FlatButton onPress={switchAuthModeHandler}>
          {isLogin ? 'Create a new user' : 'Log in instead'}
        </FlatButton>
      </View>
    </View>
  );
}

export default AuthContent;

const styles = StyleSheet.create({
  authContent: {
    marginTop: 64,
    marginHorizontal: 32,
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary800,
    elevation: 2,
    shadowColor: 'black',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  buttons: {
    marginTop: 8,
  },
});
