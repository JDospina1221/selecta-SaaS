// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBkks3UJL62VnV0rU8QksLdLKkqrvFX2AY",
  authDomain: "laselecta-pos.firebaseapp.com",
  projectId: "laselecta-pos",
  databaseURL: "https://laselecta-pos-default-rtdb.firebaseio.com",
  storageBucket: "laselecta-pos.firebasestorage.app",
  messagingSenderId: "768349005236",
  appId: "1:768349005236:web:786ee9243ee782cb3f7ee1",
  measurementId: "G-FP4E8NBN99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);