import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA7wHLcBGxbnRabPNzlG3Tvq7LOvqLNCLA",
  authDomain: "report-562cf.firebaseapp.com",
  projectId: "report-562cf",
  storageBucket: "report-562cf.firebasestorage.app",
  messagingSenderId: "444329813639",
  appId: "1:444329813639:web:096ef238a2a2e757cbba22",
  measurementId: "G-VNKH8CP6RT"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };