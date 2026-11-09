import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB45Y-s10dUJ5Ag_1j5actt_Hoeh_787ao",
  authDomain: "periodica-e0f3e.firebaseapp.com",
  projectId: "periodica-e0f3e",
  storageBucket: "periodica-e0f3e.firebasestorage.app",
  messagingSenderId: "564571843397",
  appId: "1:564571843397:web:586fab5b6c6d0577f96c2c",
  measurementId: "G-PG8TP2TP1F"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Obliga a Google a mostrar el selector de cuentas siempre que se inicie sesión
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithPopup, signOut };