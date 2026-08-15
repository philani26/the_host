// The Host with the Utmost — Firebase project config
// Project: utmost-trips (Firestore + Authentication)
const firebaseConfig = {
  apiKey: "AIzaSyCybk-4R5bP7VFB7xxePTMc4_wIjhLm7E4",
  authDomain: "utmost-trips.firebaseapp.com",
  projectId: "utmost-trips",
  storageBucket: "utmost-trips.firebasestorage.app",
  messagingSenderId: "398493046613",
  appId: "1:398493046613:web:f76f3bc34a5df7072401dc",
  measurementId: "G-XFQ7DSCHFF"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
firebase.firestore.FieldValue = { serverTimestamp: restServerTimestamp };
const db = new RestFirestore(firebaseConfig, auth);
const storage = new RestStorage(firebaseConfig, auth);
