import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, Button, FlatList, Alert, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TripsContext } from '../store/trips-context';
import { Colors } from '../constants/styles';
import IconButton from '../components/ui/IconButton'; // Załóżmy, że masz taki komponent

function NewTripScreen() {
  const [tripName, setTripName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberEmails, setMemberEmails] = useState([]); // Lista e-maili członków
  const tripsCtx = useContext(TripsContext);
  const navigation = useNavigation();

  // Funkcja do walidacji formatu e-maila
  const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  // Dodawanie e-maila do listy
  const addMemberHandler = () => {
    if (memberEmail.trim().length === 0) {
      Alert.alert('Błąd', 'Pole email nie może być puste.');
      return;
    }
    if (!validateEmail(memberEmail)) {
      Alert.alert('Błąd', 'Podaj poprawny format emaila.');
      return;
    }
    if (memberEmails.includes(memberEmail.toLowerCase())) {
      Alert.alert('Błąd', 'Ten email został już dodany.');
      return;
    }
    setMemberEmails((currentEmails) => [...currentEmails, memberEmail.toLowerCase()]);
    setMemberEmail(''); // Wyczyść pole input
    Keyboard.dismiss(); // Ukryj klawiaturę
  };

  // Usuwanie e-maila z listy
  const removeMemberHandler = (emailToRemove) => {
    setMemberEmails((currentEmails) =>
      currentEmails.filter((email) => email !== emailToRemove)
    );
  };

  // Tworzenie wyjazdu
  const createTripHandler = async () => {
    if (tripName.trim().length === 0) {
      Alert.alert('Błąd', 'Nazwa wyjazdu nie może być pusta.');
      return;
    }
    if (memberEmails.length === 0) {
      Alert.alert('Błąd', 'Dodaj przynajmniej jedną osobę do wyjazdu.');
      return;
    }

    try {
      // tripsCtx.createNewTrip wymaga tablicy e-maili
      const newTripId = await tripsCtx.createNewTrip(tripName, memberEmails);
      Alert.alert('Sukces!', 'Wyjazd został pomyślnie utworzony!');
      navigation.navigate('TripDetails', { tripId: newTripId, tripName: tripName }); // Przejdź do szczegółów nowo utworzonego wyjazdu
    } catch (error) {
      Alert.alert('Błąd tworzenia wyjazdu', error.message || 'Wystąpił błąd podczas tworzenia wyjazdu.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stwórz Nowy Wyjazd</Text>

      <TextInput
        style={styles.input}
        placeholder="Nazwa wyjazdu"
        value={tripName}
        onChangeText={setTripName}
      />

      <View style={styles.memberInputContainer}>
        <TextInput
          style={styles.memberInput}
          placeholder="Email uczestnika"
          keyboardType="email-address"
          autoCapitalize="none"
          value={memberEmail}
          onChangeText={setMemberEmail}
          onSubmitEditing={addMemberHandler} // Dodaj po naciśnięciu Enter
        />
        <Button title="Dodaj" onPress={addMemberHandler} color={Colors.primary500} />
      </View>

      <Text style={styles.subtitle}>Dodani uczestnicy:</Text>
      {memberEmails.length === 0 ? (
        <Text style={styles.noMembersText}>Brak dodanych uczestników.</Text>
      ) : (
        <FlatList
          data={memberEmails}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <View style={styles.memberItem}>
              <Text style={styles.memberText}>{item}</Text>
              <IconButton
                icon="close-outline"
                color={Colors.error500}
                size={20}
                onPress={() => removeMemberHandler(item)}
              />
            </View>
          )}
          style={styles.memberList}
        />
      )}

      <View style={styles.createButtonContainer}>
        <Button
          title="Stwórz Wyjazd"
          onPress={createTripHandler}
          color={Colors.primary500}
        />
      </View>
    </View>
  );
}

export default NewTripScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.primary100, // Użyj tła z theme
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.primary800,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  memberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  memberInput: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    color: Colors.primary500,
  },
  memberList: {
    maxHeight: 200, // Ogranicz wysokość listy
    width: '100%',
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  memberText: {
    fontSize: 16,
    color: Colors.primary800,
  },
  noMembersText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 10,
  },
  createButtonContainer: {
    marginTop: 'auto', // Przesuń przycisk na dół
    width: '100%',
    paddingVertical: 10,
  },
});