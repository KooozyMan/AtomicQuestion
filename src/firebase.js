import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAMZV7yW55YwGC7uK9SX9Pbpdz56QpUsPg',
  authDomain: 'atomicquestion-67678.firebaseapp.com',
  projectId: 'atomicquestion-67678',
  storageBucket: 'atomicquestion-67678.firebasestorage.app',
  messagingSenderId: '274347417298',
  appId: '1:274347417298:web:b0eb3f82339dd9f33b570b',
  databaseURL: 'https://atomicquestion-67678-default-rtdb.europe-west1.firebasedatabase.app',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
