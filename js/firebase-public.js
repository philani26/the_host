// The Host with the Utmost — public-site Firebase config (Firestore only)
// Used by the enquiry forms so submissions land in the real admin CMS.
const firebaseConfig = {
  apiKey: "AIzaSyAqONexzC2RDz68-8McdZs2qU6tNUR6Ulw",
  authDomain: "the-host-utmost.firebaseapp.com",
  projectId: "the-host-utmost",
  storageBucket: "the-host-utmost.firebasestorage.app",
  messagingSenderId: "104150834370",
  appId: "1:104150834370:web:0eed5c95f8c4274eb36f5b"
};

firebase.initializeApp(firebaseConfig);
const publicDb = firebase.firestore();

async function submitEnquiry(payload){
  await publicDb.collection('enquiries').add({
    ...payload,
    status: 'new',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}
