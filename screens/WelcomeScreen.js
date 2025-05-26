import axios from "axios";
import { useContext, useEffect, useState, useCallback } from "react"; // Dodaj useCallback

import { StyleSheet, Text, View, Button, FlatList, Pressable } from "react-native"; // Dodaj Button, FlatList, Pressable
import { AuthContext } from "../store/auth-context";
import { TripsContext } from "../store/trips-context"; // Importuj TripsContext
import { useNavigation } from "@react-navigation/native"; // Importuj useNavigation
import { Colors } from "../constants/styles"; // Importuj Colors

function WelcomeScreen() {
  const [fetchedMessage, setFetchedMessage] = useState(''); // Zmień na pusty string na start
  const authCtx = useContext(AuthContext);
  const tripsCtx = useContext(TripsContext); // Użyj TripsContext
  const token = authCtx.token;
  const navigation = useNavigation(); // Hook do nawigacji

  // Funkcja do pobierania wiadomości (jak w Twoim oryginalnym kodzie)
  useEffect(() => {
    axios
      .get(
        "https://hubidebt-default-rtdb.europe-west1.firebasedatabase.app/message.json?auth=" +
          token
      )
      .then((response) => {
        setFetchedMessage(response.data);
      })
      .catch(error => {
        console.error("Błąd pobierania wiadomości:", error.response ? error.response.data : error.message);
        setFetchedMessage("Nie udało się pobrać wiadomości.");
      });
  }, [token]);


  // Funkcja do nawigacji do szczegółów wyjazdu
  const navigateToTripDetails = useCallback((tripId, tripName) => {
    navigation.navigate('TripDetails', { tripId: tripId, tripName: tripName });
  }, [navigation]);

  // Funkcja do renderowania pojedynczego elementu wyjazdu w liście
  const renderTripItem = ({ item }) => (
    <Pressable
      style={({ pressed }) => [
        styles.tripItem,
        pressed && styles.pressedItem
      ]}
      onPress={() => navigateToTripDetails(item.id, item.name)}
    >
      <Text style={styles.tripName}>{item.name}</Text>
      <Text style={styles.tripStatus}>Status: {item.status === 'active' ? 'Aktywny' : 'Zakończony'}</Text>
    </Pressable>
  );

  return (
    <View style={styles.rootContainer}>
      <Text style={styles.title}>Witaj, {authCtx.email || 'Użytkowniku'}!</Text>
      <Text style={{marginBottom: 16}}>Jesteś zalogowany!</Text>
      {fetchedMessage && <Text style={{marginBottom: 24}}>{fetchedMessage}</Text>}

      {/* Przyciski do nowych funkcji */}
      <View style={styles.buttonsContainer}>
        <Button
          title="Stwórz Nowy Wyjazd"
          onPress={() => navigation.navigate('NewTrip')}
          color={Colors.primary500}
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="Moje Rozliczenia"
          onPress={() => navigation.navigate('MySpendings')}
          color={Colors.primary500}
        />
      </View>

      {/* Lista wyjazdów */}
      <Text style={styles.sectionTitle}>Twoje Wyjazdy:</Text>
      {tripsCtx.userTrips.length > 0 ? (
        <FlatList
          data={tripsCtx.userTrips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          style={styles.tripsList}
        />
      ) : (
        <Text style={styles.noTripsText}>Brak aktywnych wyjazdów. Stwórz nowy!</Text>
      )}
    </View>
  );
}

export default WelcomeScreen;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    justifyContent: "flex-start", // Zmień na flex-start, aby elementy były od góry
    alignItems: "center",
    padding: 32,
    paddingTop: 50, // Dodatkowy padding na górze
  },
  title: {
    fontSize: 24, // Zwiększ rozmiar tytułu
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.primary500, // Użyj koloru z theme
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: Colors.primary500,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  buttonSpacer: {
    width: 20, // Odstęp między przyciskami
  },
  tripsList: {
    width: '100%',
    marginTop: 10,
  },
  tripItem: {
    backgroundColor: Colors.primary100, // Użyj jasnego koloru z theme
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2, // Cień dla Androida
    shadowColor: '#000', // Cień dla iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  pressedItem: {
    opacity: 0.75,
  },
  tripName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary800,
  },
  tripStatus: {
    fontSize: 14,
    color: Colors.primary500,
    marginTop: 4,
  },
  noTripsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  }
});