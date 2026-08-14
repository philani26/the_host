// The Host with the Utmost — Firebase project config
// Project: utmost-travel (Firestore + Authentication)
const firebaseConfig = {
  apiKey: "AIzaSyDEecAmK9igLbXl26KBAyxursiNLw9p1eg",
  authDomain: "utmost-travel.firebaseapp.com",
  projectId: "utmost-travel",
  storageBucket: "utmost-travel.firebasestorage.app",
  messagingSenderId: "919080241127",
  appId: "1:919080241127:web:a2f3b76c120925847e5f42",
  measurementId: "G-WE11N5HM2W"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
db.settings({ experimentalForceLongPolling: true });
const auth = firebase.auth();
