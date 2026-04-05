// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC-HodBQeatCrJPLWcm96L6gLabVJvZKyw",
  authDomain: "app-tuoi-cay-vvh.firebaseapp.com",
  projectId: "app-tuoi-cay-vvh",
  storageBucket: "app-tuoi-cay-vvh.firebasestorage.app",
  messagingSenderId: "739614880511",
  appId: "1:739614880511:web:53d229597ec9969b50d2ca",
  measurementId: "G-343PBHZ7PB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);