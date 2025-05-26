// store/auth-context.js
import { createContext, useEffect, useState, useCallback } from "react"; // Dodaj useCallback
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext({
  token: "",
  uid: "", // DODANE: UID użytkownika
  email: "", // DODANE: Email użytkownika
  isAuthenticated: false,
  authenticate: (token, uid, email) => {}, // Zmieniona sygnatura funkcji
  logout: () => {},
});

function AuthContextProvider({ children }) {
  const [authToken, setAuthToken] = useState();
  const [authUid, setAuthUid] = useState(); // NOWY STAN DLA UID
  const [authEmail, setAuthEmail] = useState(); // NOWY STAN DLA EMAILA

  // Użyj useCallback, aby funkcja authenticate była stabilna
  const authenticate = useCallback((token, uid, email) => { // Zmieniona sygnatura
    setAuthToken(token);
    setAuthUid(uid); // Ustaw UID
    setAuthEmail(email); // Ustaw email

    // Zapisz wszystkie dane w AsyncStorage
    AsyncStorage.setItem("token", token);
    AsyncStorage.setItem("uid", uid);
    AsyncStorage.setItem("email", email);

    console.log("AuthContext: authenticate called, token set:", !!token, "uid set:", !!uid, "email set:", !!email);
  }, []); // Pusta tablica zależności, bo authenticate nie zależy od żadnych zmiennych komponentu

  // Użyj useCallback, aby funkcja logout była stabilna
  const logout = useCallback(() => {
    setAuthToken(null);
    setAuthUid(null); // Wyczyść UID
    setAuthEmail(null); // Wyczyść email

    // Usuń wszystkie dane z AsyncStorage
    AsyncStorage.removeItem("token");
    AsyncStorage.removeItem("uid");
    AsyncStorage.removeItem("email");

    console.log("AuthContext: logout called, token cleared.");
  }, []); // Pusta tablica zależności

  // Efekt do pobierania danych z AsyncStorage przy starcie aplikacji
  useEffect(() => {
    async function fetchStoredAuthData() {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUid = await AsyncStorage.getItem("uid"); // Pobierz UID
      const storedEmail = await AsyncStorage.getItem("email"); // Pobierz email

      if (storedToken && storedUid && storedEmail) {
        authenticate(storedToken, storedUid, storedEmail); // Uwierzytelnij z pełnymi danymi
      }
    }

    fetchStoredAuthData();
  }, [authenticate]); // Zależność od funkcji authenticate

  const value = {
    token: authToken,
    uid: authUid, // UDOSTĘPNIJ UID
    email: authEmail, // UDOSTĘPNIJ EMAIL
    isAuthenticated: !!authToken, // isAuthenticated zależy tylko od tokena
    authenticate: authenticate,
    logout: logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContextProvider;