// store/trips-context.js
import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import 'react-native-get-random-values'; // Wymagane przez uuid dla React Native
import uuid from 'react-native-uuid';
import { AuthContext } from './auth-context'; // Importuj AuthContext

// Zaktualizuj ścieżkę do API_KEY, jeśli jest w innym miejscu
const API_KEY = 'AIzaSyA_tMQNn2u2dtZbw5mmZ_fAys16STMNS9c'; // Twój klucz API Firebase

export const TripsContext = createContext({
  userTrips: [], // Wyjazdy, w których uczestniczy bieżący użytkownik
  userBalances: {
    owedToMe: {},
    iOwe: {}
  }, // Łączne bilanse dla użytkownika
  fetchUserTrips: () => {},
  fetchUserBalances: () => {},
  createNewTrip: async (name, memberEmails) => {},
  addExpense: async (tripId, expenseData) => {},
  completeTrip: async (tripId) => {},
  // ... inne funkcje, które możesz dodać
});

function TripsContextProvider({ children }) {
  const [userTrips, setUserTrips] = useState([]);
  const [userBalances, setUserBalances] = useState({ owedToMe: {}, iOwe: {} });
  const authCtx = useContext(AuthContext); // Dostęp do tokena i UID użytkownika

  const databaseUrl = 'https://hubidebt-default-rtdb.europe-west1.firebasedatabase.app/'; // Twój URL bazy danych

  // Funkcja do pobierania ID użytkownika na podstawie e-maila
  // UWAGA: To jest uproszczona wersja. W prawdziwej aplikacji potrzebujesz Cloud Function
  // lub zindeksowanych danych użytkowników.
  const fetchUserUidByEmail = async (email) => {
    try {
      const response = await axios.get(`${databaseUrl}users.json?orderBy="email"&equalTo="${email}"&auth=${authCtx.token}`);
      const data = response.data;
      if (data) {
        // Firebase zwraca obiekt, gdzie kluczem jest UID
        const uids = Object.keys(data);
        if (uids.length > 0) {
          return uids[0]; // Zwróć pierwszy pasujący UID
        }
      }
      return null; // Email nie znaleziony
    } catch (error) {
      console.error('Błąd podczas pobierania UID po emailu:', error);
      return null;
    }
  };


  // --- Funkcje do interakcji z Firebase Realtime Database ---

  // Tworzenie nowego wyjazdu
  async function createNewTrip(name, memberEmails) {
  if (!authCtx.token || !authCtx.uid) {
    console.error("Użytkownik niezalogowany. Token lub UID brak.");
    throw new Error("Brak autoryzacji.");
  }

  try {
      // Pobierz UID dla każdego e-maila członka
      const members = await Promise.all(
        memberEmails.map(async (email) => {
          const uid = await fetchUserUidByEmail(email);
          if (uid) {
            return { uid: uid, email: email };
          }
          return null; // Jeśli email nie ma przypisanego UID
        })
      );
      const validMembers = members.filter(m => m !== null);

      // Dodaj twórcę wyjazdu do listy członków
      validMembers.push({ uid: authCtx.uid, email: authCtx.email });

      const membersData = {};
    validMembers.forEach(member => {
      membersData[member.uid] = { email: member.email };
    });

    const tripId = uuid.v4(); // Generuj unikalne ID wyjazdu

    // === DODAJ TE LOGI TUTAJ ===
    console.log("CREATE TRIP - authCtx.uid:", authCtx.uid);
    console.log("CREATE TRIP - authCtx.email:", authCtx.email);
    console.log("CREATE TRIP - tripId:", tripId);
    console.log("CREATE TRIP - name:", name);
    console.log("CREATE TRIP - membersData:", membersData);
    console.log("CREATE TRIP - Endpoint PUT:", `${databaseUrl}trips/${tripId}.json?auth=${authCtx.token}`);
    // === KONIEC LOGÓW ===

    await axios.put(
      `${databaseUrl}trips/${tripId}.json?auth=${authCtx.token}`,
      {
        creatorId: authCtx.uid, // <-- Upewnij się, że authCtx.uid jest tu poprawne
        name: name,
        members: membersData, // <-- Upewnij się, że membersData zawiera też authCtx.uid
        expenses: {},
        status: 'active',
      }
    );

    // === DODAJ TE LOGI TUTAJ ===
    console.log("CREATE TRIP - Endpoint PATCH (userUpdates):", `${databaseUrl}.json?auth=${authCtx.token}`);
    console.log("CREATE TRIP - userUpdates:", userUpdates);
    // === KONIEC LOGÓW ===

    // Zaktualizuj listę wyjazdów dla każdego członka w ich profilach użytkownika
    const userUpdates = {};
    for (const memberUid in membersData) {
      userUpdates[`users/${memberUid}/trips/${tripId}`] = true;
    }
    // Upewnij się, że twórca jest na pewno dodany do swojej listy wyjazdów
    userUpdates[`users/${authCtx.uid}/trips/${tripId}`] = true; // Zabezpieczenie, jeśli membersData nie zawierało twórcy

    await axios.patch(`${databaseUrl}.json?auth=${authCtx.token}`, userUpdates);

      // Odśwież listę wyjazdów dla bieżącego użytkownika
      fetchUserTrips();

      return tripId; // Zwróć ID nowo utworzonego wyjazdu
    } catch (error) {
      console.error('Błąd tworzenia wyjazdu:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  // Pobieranie wszystkich wyjazdów użytkownika
  async function fetchUserTrips() {
    if (!authCtx.token || !authCtx.uid) {
      setUserTrips([]);
      return;
    }

    try {
      // Najpierw pobierz listę tripId z profilu użytkownika
      const userTripsResponse = await axios.get(
        `${databaseUrl}users/${authCtx.uid}/trips.json?auth=${authCtx.token}`
      );
      const userTripIds = userTripsResponse.data ? Object.keys(userTripsResponse.data) : [];

      if (userTripIds.length === 0) {
        setUserTrips([]);
        return;
      }

      // Następnie pobierz szczegóły każdego wyjazdu
      const fetchedTrips = [];
      for (const tripId of userTripIds) {
        const tripResponse = await axios.get(
          `${databaseUrl}trips/${tripId}.json?auth=${authCtx.token}`
        );
        fetchedTrips.push({ id: tripId, ...tripResponse.data });
      }

      setUserTrips(fetchedTrips);
    } catch (error) {
      console.error('Błąd pobierania wyjazdów użytkownika:', error.response ? error.response.data : error.message);
      setUserTrips([]);
    }
  }

  // Dodawanie wydatku do wyjazdu
  async function addExpense(tripId, expenseData) {
    if (!authCtx.token) {
      throw new Error("Brak autoryzacji.");
    }

    try {
      const expenseId = uuid.v4(); // Generuj unikalne ID wydatku
      await axios.put(
        `${databaseUrl}trips/${tripId}/expenses/${expenseId}.json?auth=${authCtx.token}`,
        expenseData
      );
      console.log('Wydatek dodany:', expenseId);
      // Odśwież dane wyjazdu, aby zaktualizować listę wydatków
      fetchUserTrips(); // Możesz zoptymalizować do pobierania tylko jednego wyjazdu
    } catch (error) {
      console.error('Błąd dodawania wydatku:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  // Zakończenie wyjazdu i obliczenie bilansów
  async function completeTrip(tripId) {
    if (!authCtx.token || !authCtx.uid) {
      throw new Error("Brak autoryzacji.");
    }

    try {
      // Pobierz szczegóły wyjazdu
      const tripResponse = await axios.get(
        `${databaseUrl}trips/${tripId}.json?auth=${authCtx.token}`
      );
      const tripData = tripResponse.data;

      if (!tripData || tripData.creatorId !== authCtx.uid) {
        throw new Error("Brak uprawnień lub wyjazd nie istnieje.");
      }

      const expenses = tripData.expenses || {};
      const members = tripData.members || {};

      // Obliczanie bilansów dla tego wyjazdu
      const tripBalances = {}; // Bilans dla każdego członka w TYM wyjeździe
      for (const memberUid in members) {
        tripBalances[memberUid] = 0;
      }

      for (const expenseId in expenses) {
        const expense = expenses[expenseId];
        const paidBy = expense.paidBy; // Kto zapłacił
        const owedAmounts = expense.owedAmounts || {}; // Ile kto jest dłużny osobie płacącej

        // Dodaj kwotę do osoby, która zapłaciła
        tripBalances[paidBy] += expense.amount;

        // Odejm kwoty od osób, które są dłużne
        for (const debtorUid in owedAmounts) {
          tripBalances[debtorUid] -= owedAmounts[debtorUid];
        }
      }

      // Aktualizacja globalnych bilansów w profilach użytkowników
      const globalUserUpdates = {};
      for (const memberUid in members) {
        const balance = tripBalances[memberUid];

        for (const otherMemberUid in members) {
          if (memberUid === otherMemberUid) continue;

          // Ile memberUid jest dłużny otherMemberUid
          const amountIOwe = balance < 0 ? Math.abs(balance) : 0;
          if (amountIOwe > 0) {
            globalUserUpdates[`users/${memberUid}/totalIOwe/${otherMemberUid}`] =
                (globalUserUpdates[`users/${memberUid}/totalIOwe/${otherMemberUid}`] || 0) + amountIOwe;
            globalUserUpdates[`users/${otherMemberUid}/totalOwedToMe/${memberUid}`] =
                (globalUserUpdates[`users/${otherMemberUid}/totalOwedToMe/${memberUid}`] || 0) + amountIOwe;
          }

          // Ile otherMemberUid jest dłużny memberUid
          const amountOwedToMe = balance > 0 ? balance : 0;
          if (amountOwedToMe > 0) {
            globalUserUpdates[`users/${memberUid}/totalOwedToMe/${otherMemberUid}`] =
                (globalUserUpdates[`users/${memberUid}/totalOwedToMe/${otherMemberUid}`] || 0) + amountOwedToMe;
            globalUserUpdates[`users/${otherMemberUid}/totalIOwe/${memberUid}`] =
                (globalUserUpdates[`users/${otherMemberUid}/totalIOwe/${memberUid}`] || 0) + amountOwedToMe;
          }
        }
      }


      // Zaktualizuj status wyjazdu na "completed" i dodaj bilanse w Firebase
      await axios.patch(
        `${databaseUrl}trips/${tripId}.json?auth=${authCtx.token}`,
        {
          status: 'completed',
          balances: tripBalances, // Zapisz bilanse dla tego wyjazdu
        }
      );

      // Zapisz globalne bilanse w profilach użytkowników
      await axios.patch(`${databaseUrl}.json?auth=${authCtx.token}`, globalUserUpdates);

      console.log('Wyjazd zakończony i bilanse zaktualizowane.');
      fetchUserTrips(); // Odśwież listę wyjazdów
      fetchUserBalances(); // Odśwież globalne bilanse
    } catch (error) {
      console.error('Błąd kończenia wyjazdu:', error.response ? error.response.data : error.message);
      throw error;
    }
  }


  // Pobieranie globalnych bilansów użytkownika
  async function fetchUserBalances() {
    if (!authCtx.token || !authCtx.uid) {
      setUserBalances({ owedToMe: {}, iOwe: {} });
      return;
    }
    try {
      const response = await axios.get(
        `${databaseUrl}users/${authCtx.uid}.json?auth=${authCtx.token}`
      );
      const userData = response.data;
      setUserBalances({
        owedToMe: userData?.totalOwedToMe || {},
        iOwe: userData?.totalIOwe || {},
      });
    } catch (error) {
      console.error('Błąd pobierania bilansów użytkownika:', error.response ? error.response.data : error.message);
      setUserBalances({ owedToMe: {}, iOwe: {} });
    }
  }

  // Uruchamiaj pobieranie wyjazdów i bilansów, gdy użytkownik jest zalogowany
  useEffect(() => {
    if (authCtx.isAuthenticated && authCtx.uid) {
      fetchUserTrips();
      fetchUserBalances();
    }
  }, [authCtx.isAuthenticated, authCtx.token, authCtx.uid]); // Zależności

  const value = {
    userTrips: userTrips,
    userBalances: userBalances,
    fetchUserTrips: fetchUserTrips,
    fetchUserBalances: fetchUserBalances,
    createNewTrip: createNewTrip,
    addExpense: addExpense,
    completeTrip: completeTrip,
  };

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

export default TripsContextProvider;