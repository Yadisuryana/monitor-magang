// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDt33VaWkFq14bAyeb1WAjjLXlGrFu_cbk",
  authDomain: "monitoring-magang-id.firebaseapp.com",
  projectId: "monitoring-magang-id",
  storageBucket: "monitoring-magang-id.firebasestorage.app",
  messagingSenderId: "443953799892",
  appId: "1:443953799892:web:9476952a6b81064eed1141",
  measurementId: "G-WZE9W33687"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)


export { auth };
