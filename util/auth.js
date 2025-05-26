// util/auth.js (Zaktualizowany z Firebase SDK)
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig  from '../config/firebase-config'; // <--- TA LINIA JEST TERAZ KLUCZOWA I PRAWIDŁOWA!

// DODATKOWY LOG (DLA DIAGNOSTYKI):
console.log("DEBUG: firebaseConfig object:", firebaseConfig);


// Zainicjuj Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Pobierz instancję usługi Auth

async function authenticateWithFirebaseSDK(mode, email, password) {
  try {
    let userCredential;
    if (mode === 'signUp') {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    } else if (mode === 'signInWithPassword') {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } else {
      throw new Error("Nieprawidłowy tryb uwierzytelniania.");
    }

    const user = userCredential.user;
    const token = await user.getIdToken(); // To generuje PRAWIDŁOWY token Firebase!
    const uid = user.uid;
    const userEmail = user.email;

    console.log('Firebase Auth SDK SUKCES: Użytkownik uwierzytelniony', user);
    return { token, uid, userEmail };

  } catch (error) {
    console.error('Firebase Auth SDK BŁĄD:', error.code, error.message);
    let errorMessage = 'Uwierzytelnianie nie powiodło się.';
    if (error.code) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
}

export function createUser(email, password) {
  return authenticateWithFirebaseSDK('signUp', email, password);
}

export function login(email, password) {
  return authenticateWithFirebaseSDK('signInWithPassword', email, password);
}

// *** USUNIĘTO DUPLIKAT firebaseConfig Z TEGO PLIKU ***