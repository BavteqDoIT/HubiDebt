import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { TripsContext } from '../store/trips-context';
import { AuthContext } from '../store/auth-context';
import { Colors } from '../constants/styles';
import axios from 'axios'; // Potrzebny do pobierania e-maili na podstawie UID

function MySpendingsScreen() {
  const tripsCtx = useContext(TripsContext);
  const authCtx = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmails, setUserEmails] = useState({}); // Mapa UID -> email

  // Funkcja do pobierania e-maili użytkowników
  // UWAGA: Nadal jest to uproszczona wersja. Dla produkcyjnej aplikacji
  // rozważ Firebase Cloud Functions lub publicznie dostępne dane użytkowników.
  const fetchEmailsForUids = useCallback(async (uids) => {
    const fetchedEmails = {};
    if (!authCtx.token) return fetchedEmails;

    // Próbuj pobrać wszystkie dane użytkowników na raz
    try {
        const response = await axios.get(`https://hubidebt-default-rtdb.europe-west1.firebasedatabase.app/users.json?auth=${authCtx.token}`);
        const allUsersData = response.data;

        for (const uid of uids) {
            if (allUsersData[uid] && allUsersData[uid].email) {
                fetchedEmails[uid] = allUsersData[uid].email;
            } else {
                fetchedEmails[uid] = `Nieznany Użytkownik (${uid})`;
            }
        }
    } catch (error) {
        console.error('Błąd pobierania e-maili użytkowników:', error.response ? error.response.data : error.message);
        // Jeśli jest błąd, spróbuj pobrać pojedynczo (mniej efektywne)
        for (const uid of uids) {
            try {
                const userResponse = await axios.get(`https://hubidebt-default-rtdb.europe-west1.firebasedatabase.app/users/${uid}/email.json?auth=${authCtx.token}`);
                fetchedEmails[uid] = userResponse.data || `Nieznany Użytkownik (${uid})`;
            } catch (singleUserError) {
                fetchedEmails[uid] = `Nieznany Użytkownik (${uid})`;
            }
        }
    }
    return fetchedEmails;
  }, [authCtx.token]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await tripsCtx.fetchUserBalances(); // Upewnij się, że bilanse są aktualne

      // Zbierz wszystkie UID z bilansów do pobrania e-maili
      const allUids = new Set();
      Object.keys(tripsCtx.userBalances.owedToMe).forEach(uid => allUids.add(uid));
      Object.keys(tripsCtx.userBalances.iOwe).forEach(uid => allUids.add(uid));

      if (allUids.size > 0) {
        const emails = await fetchEmailsForUids(Array.from(allUids));
        setUserEmails(emails);
      }
      setIsLoading(false);
    };

    if (authCtx.isAuthenticated) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [authCtx.isAuthenticated, tripsCtx.userBalances, tripsCtx.fetchUserBalances, fetchEmailsForUids]); // Dodaj tripsCtx.userBalances jako zależność

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary500} />
        <Text style={styles.loadingText}>Ładowanie rozliczeń...</Text>
      </View>
    );
  }

  const owedToMeData = Object.keys(tripsCtx.userBalances.owedToMe).map(uid => ({
    uid: uid,
    amount: tripsCtx.userBalances.owedToMe[uid],
    type: 'toMe',
    email: userEmails[uid] || `UID: ${uid}`,
  }));

  const iOweData = Object.keys(tripsCtx.userBalances.iOwe).map(uid => ({
    uid: uid,
    amount: tripsCtx.userBalances.iOwe[uid],
    type: 'iOwe',
    email: userEmails[uid] || `UID: ${uid}`,
  }));

  const allBalancesData = [...owedToMeData, ...iOweData];

  if (allBalancesData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Moje Rozliczenia</Text>
        <Text style={styles.noBalancesText}>Brak rozliczeń. Bilans jest aktualizowany po zakończeniu wyjazdu.</Text>
      </View>
    );
  }

  const renderBalanceItem = ({ item }) => (
    <View style={styles.balanceItem}>
      <Text style={styles.balanceEmail}>{item.email}</Text>
      <Text style={[styles.balanceAmount, item.type === 'toMe' ? styles.positiveAmount : styles.negativeAmount]}>
        {item.type === 'toMe' ? 'Należy Ci się: ' : 'Jesteś dłużny: '}
        {item.amount.toFixed(2)} PLN
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Moje Rozliczenia</Text>
      <FlatList
        data={allBalancesData}
        keyExtractor={(item) => item.uid + item.type} // Unikalny klucz
        renderItem={renderBalanceItem}
        style={styles.balancesList}
      />
    </View>
  );
}

export default MySpendingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.primary100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.primary500,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.primary800,
  },
  balancesList: {
    width: '100%',
  },
  balanceItem: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  balanceEmail: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary800,
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: 'green',
  },
  negativeAmount: {
    color: 'red',
  },
  noBalancesText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  },
});