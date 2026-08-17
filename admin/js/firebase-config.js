// The Host with the Utmost — Firebase project config
// Project: utmost-trips-aaae0 (Firestore + Authentication)
const firebaseConfig = {
  apiKey: "AIzaSyCKEZHDpTJmF-33lkmbxnBL7wAZQtFr4Jo",
  authDomain: "utmost-trips-aaae0.firebaseapp.com",
  projectId: "utmost-trips-aaae0",
  storageBucket: "utmost-trips-aaae0.firebasestorage.app",
  messagingSenderId: "411162201421",
  appId: "1:411162201421:web:8ccd5eb89948115b83bb04",
  measurementId: "G-T0J31FVVZD"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
firebase.firestore.FieldValue = { serverTimestamp: restServerTimestamp };
const db = new RestFirestore(firebaseConfig, auth);
const storage = new RestStorage(firebaseConfig, auth);
