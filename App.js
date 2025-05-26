import { useContext, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import { Colors } from "./constants/styles"; // Już masz zaimportowane
import AuthContextProvider, { AuthContext } from "./store/auth-context";
import IconButton from "./components/ui/IconButton";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Importuj nowe ekrany
import NewTripScreen from "./screens/NewTripScreen";
import TripDetailsScreen from "./screens/TripDetailsScreen";
import AddExpenseScreen from "./screens/AddExpenseScreen";
import MySpendingsScreen from "./screens/MySpendingsScreen";
import TripsContextProvider from "./store/trips-context";
import { ActivityIndicator, Text, View } from "react-native";

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary500 },
        headerTintColor: "white",
        contentStyle: { backgroundColor: Colors.primary100 },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function AuthenticatedStack() {
  const authCtx = useContext(AuthContext);
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary500 },
        headerTintColor: "white",
        contentStyle: { backgroundColor: Colors.primary100 },
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{
          headerRight: ({ tintColor }) => (
            <IconButton
              icon="exit-outline"
              color={tintColor}
              size={24}
              onPress={authCtx.logout}
            />
          ),
        }}
      />
      {/* --- DODANE EKRANY --- */}
      <Stack.Screen
        name="NewTrip"
        component={NewTripScreen}
        options={{
          title: "Nowy Wyjazd", // Tytuł na górze ekranu
        }}
      />
      <Stack.Screen
        name="TripDetails"
        component={TripDetailsScreen}
        options={({ route }) => ({
          title: route.params?.tripName || "Szczegóły Wyjazdu", // Dynamiczny tytuł
        })}
      />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{
          title: "Dodaj Wydatek",
        }}
      />
      <Stack.Screen
        name="MySpendings"
        component={MySpendingsScreen}
        options={{
          title: "Moje Rozliczenia",
        }}
      />
      {/* --- KONIEC DODANYCH EKRANÓW --- */}
    </Stack.Navigator>
  );
}

function Navigation() {
  const authCtx = useContext(AuthContext);

  return (
    <NavigationContainer>
      {!authCtx.isAuthenticated && <AuthStack />}
      {authCtx.isAuthenticated && <AuthenticatedStack />}
    </NavigationContainer>
  );
}

function Root() {
  const authCtx = useContext(AuthContext);
  const [isAuthenticating, setIsAuthenticating] = useState(true); // Masz to

  useEffect(() => {
    async function fetchToken() {
      const storedToken = await AsyncStorage.getItem("token");

      if (storedToken) {
        authCtx.authenticate(storedToken);
      }
      setIsAuthenticating(false); // Tu ustawiasz na false
    }

    fetchToken();
  }, []);

  // Dodaj ten warunek, jeśli go jeszcze nie masz
  if (isAuthenticating) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.primary100,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary500} />
        <Text style={{ marginTop: 10, color: Colors.primary800 }}>
          Ładowanie użytkownika...
        </Text>
      </View>
    );
  }
  console.log("Root: isAuthenticated =", authCtx.isAuthenticated);
  return <Navigation />; // To się renderuje dopiero po załadowaniu
}

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <AuthContextProvider>
        <TripsContextProvider>
          <Root />
        </TripsContextProvider>
      </AuthContextProvider>
    </>
  );
}

// Reszta kodu z auth.js, AuthContext.js i WelcomeScreen.js jest bez zmian w App.js
// Pamiętaj, że auth.js i AuthContext.js to oddzielne pliki, a nie część App.js
