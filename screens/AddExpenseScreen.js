import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, FlatList, Alert, Keyboard, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TripsContext } from '../store/trips-context';
import { AuthContext } from '../store/auth-context';
import { Colors } from '../constants/styles';
import { Picker } from '@react-native-picker/picker'; // Musisz zainstalować: npm install @react-native-picker/picker

// Zainstaluj @react-native-picker/picker, jeśli jeszcze nie masz
// npm install @react-native-picker/picker
// lub yarn add @react-native-picker/picker

function AddExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const tripsCtx = useContext(TripsContext);
  const authCtx = useContext(AuthContext);

  const tripId = route.params?.tripId;
  const tripMembers = route.params?.members; // Otrzymujemy mapę UID -> { email, displayName }

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(authCtx.uid); // Domyślnie, bieżący użytkownik
  const [participants, setParticipants] = useState([]); // { uid: string, email: string, isParticipating: boolean, customAmount: string }

  useEffect(() => {
    // Zainicjuj uczestników na podstawie tripMembers
    if (tripMembers) {
      const initialParticipants = Object.keys(tripMembers).map(uid => ({
        uid: uid,
        email: tripMembers[uid].email,
        isParticipating: true, // Domyślnie wszyscy uczestniczą
        customAmount: '', // Domyślnie brak niestandardowej kwoty
      }));
      setParticipants(initialParticipants);
    }
  }, [tripMembers]);

  const calculateEqualSplit = () => {
    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      Alert.alert('Błąd', 'Podaj poprawną kwotę wydatku.');
      return;
    }

    const participatingMembers = participants.filter(p => p.isParticipating);
    if (participatingMembers.length === 0) {
      Alert.alert('Błąd', 'Wybierz co najmniej jednego uczestnika.');
      return;
    }

    const share = totalAmount / participatingMembers.length;
    setParticipants(prevParticipants =>
      prevParticipants.map(p => ({
        ...p,
        customAmount: p.isParticipating ? share.toFixed(2) : '',
      }))
    );
  };

  const addExpenseHandler = async () => {
    const totalAmount = parseFloat(amount);
    if (description.trim().length === 0 || isNaN(totalAmount) || totalAmount <= 0) {
      Alert.alert('Błąd', 'Wypełnij poprawnie opis i kwotę wydatku.');
      return;
    }

    const selectedParticipants = participants.filter(p => p.isParticipating);
    if (selectedParticipants.length === 0) {
      Alert.alert('Błąd', 'Wybierz co najmniej jednego uczestnika wydatku.');
      return;
    }

    const expenseParticipants = {}; // Kto ile powinien zapłacić (docelowy podział)
    let sumOfParticipantAmounts = 0;
    const owedAmounts = {}; // Kto jest dłużny osobie płacącej za ten wydatek

    selectedParticipants.forEach(p => {
      const pAmount = parseFloat(p.customAmount);
      if (isNaN(pAmount) || pAmount < 0) {
        Alert.alert('Błąd', `Kwota dla ${p.email} jest nieprawidłowa.`);
        throw new Error('Nieprawidłowa kwota'); // Rzuć błąd, aby przerwać funkcję
      }
      expenseParticipants[p.uid] = pAmount;
      sumOfParticipantAmounts += pAmount;

      // Jeśli uczestnik nie jest osobą płacącą, to jest dłużny
      if (p.uid !== paidBy) {
        owedAmounts[p.uid] = pAmount;
      }
    });

    if (Math.abs(sumOfParticipantAmounts - totalAmount) > 0.01) { // Tolerancja dla zaokrągleń
      Alert.alert('Błąd', `Suma kwot uczestników (${sumOfParticipantAmounts.toFixed(2)} PLN) nie zgadza się z całkowitą kwotą wydatku (${totalAmount.toFixed(2)} PLN).`);
      return;
    }

    const expenseData = {
      description: description,
      amount: totalAmount,
      paidBy: paidBy,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      participants: expenseParticipants, // Kto ile powinien zapłacić
      owedAmounts: owedAmounts, // Kto jest dłużny osobie płacącej
    };

    try {
      await tripsCtx.addExpense(tripId, expenseData);
      Alert.alert('Sukces!', 'Wydatek został pomyślnie dodany!');
      navigation.goBack(); // Wróć do szczegółów wyjazdu
    } catch (error) {
      Alert.alert('Błąd dodawania wydatku', error.message || 'Wystąpił błąd podczas dodawania wydatku.');
    }
  };

  const renderParticipantItem = ({ item }) => (
    <View style={styles.participantRow}>
      <Pressable
        style={styles.checkboxContainer}
        onPress={() =>
          setParticipants(prev =>
            prev.map(p =>
              p.uid === item.uid ? { ...p, isParticipating: !p.isParticipating } : p
            )
          )
        }
      >
        <View style={[styles.checkbox, item.isParticipating && styles.checkedCheckbox]} />
        <Text style={styles.participantEmail}>{item.email}</Text>
      </Pressable>

      <TextInput
        style={[styles.participantAmountInput, !item.isParticipating && styles.disabledInput]}
        keyboardType="numeric"
        placeholder="0.00"
        value={item.customAmount}
        onChangeText={(text) =>
          setParticipants(prev =>
            prev.map(p =>
              p.uid === item.uid ? { ...p, customAmount: text.replace(/[^0-9.]/g, '') } : p
            )
          )
        }
        editable={item.isParticipating}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dodaj Wydatek</Text>

      <TextInput
        style={styles.input}
        placeholder="Opis wydatku (np. obiad, paliwo)"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Kwota całkowita (np. 150.00)"
        keyboardType="numeric"
        value={amount}
        onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))} // Tylko liczby i kropka
      />

      <Text style={styles.label}>Kto zapłacił?</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={paidBy}
          onValueChange={(itemValue) => setPaidBy(itemValue)}
          style={styles.picker}
        >
          {Object.keys(tripMembers).map(uid => (
            <Picker.Item
              key={uid}
              label={tripMembers[uid]?.email || `UID: ${uid}`}
              value={uid}
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.sectionTitle}>Uczestnicy wydatku:</Text>
      <Button
        title="Rozdziel po równo"
        onPress={calculateEqualSplit}
        color={Colors.primary500}
      />
      <FlatList
        data={participants}
        keyExtractor={(item) => item.uid}
        renderItem={renderParticipantItem}
        style={styles.participantsList}
      />

      <View style={styles.addButtonContainer}>
        <Button
          title="Dodaj Wydatek"
          onPress={addExpenseHandler}
          color={Colors.primary500}
        />
      </View>
    </View>
  );
}

export default AddExpenseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.primary100,
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
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.primary500,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: Colors.primary500,
  },
  participantsList: {
    maxHeight: 300, // Ogranicz wysokość listy
    width: '100%',
    marginBottom: 20,
  },
  participantRow: {
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2, // Większa część dla nazwy
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary500,
    marginRight: 10,
  },
  checkedCheckbox: {
    backgroundColor: Colors.primary500,
  },
  participantEmail: {
    fontSize: 15,
    color: Colors.primary800,
  },
  participantAmountInput: {
    flex: 1, // Mniejsza część dla inputu
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 15,
    textAlign: 'right',
  },
  disabledInput: {
    backgroundColor: '#e0e0e0',
    color: '#888',
  },
  addButtonContainer: {
    marginTop: 'auto',
    width: '100%',
    paddingVertical: 10,
  },
});