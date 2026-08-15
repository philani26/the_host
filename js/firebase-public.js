// The Host with the Utmost — public-site Firebase layer
// Used by the enquiry forms (writes) and by the homepage/trips/gallery
// pages (reads) so CMS edits show up on the live site.
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
firebase.firestore.FieldValue = { serverTimestamp: restServerTimestamp };
const publicDb = new RestFirestore(firebaseConfig, null);

async function submitEnquiry(payload){
  await publicDb.collection('enquiries').add({
    ...payload,
    status: 'new',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/* ---------------- Public reads (published content only) ---------------- */
async function fetchPublishedTrips(){
  const snap = await publicDb.collection('trips').where('status', '==', 'published').get();
  const trips = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  trips.sort((a, b) => new Date(a.dateStart) - new Date(b.dateStart));
  return trips;
}

async function fetchPublishedTestimonials(){
  const snap = await publicDb.collection('testimonials').where('status', '==', 'published').get();
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (a.order || 0) - (b.order || 0));
  return list;
}

async function fetchGalleryImages(){
  const snap = await publicDb.collection('gallery').get();
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (a.order || 0) - (b.order || 0));
  return list;
}

async function fetchSiteSettings(){
  const doc = await publicDb.collection('settings').doc('site').get();
  return doc.exists ? doc.data() : {};
}

/* ---------------- Small formatting helpers (mirrors admin.js) ---------------- */
function fmtDateRange(startISO, endISO){
  const opts = { day:'numeric', month:'short', year:'numeric' };
  const s = new Date(startISO), e = new Date(endISO);
  const sStr = s.toLocaleDateString('en-ZA', { day:'numeric', month:'short' });
  const eStr = e.toLocaleDateString('en-ZA', opts);
  return `${sStr} – ${eStr}`;
}
function fmtLongDateRange(startISO, endISO){
  const s = new Date(startISO), e = new Date(endISO);
  const sStr = s.toLocaleDateString('en-ZA', { day:'numeric', month:'long' });
  const eStr = e.toLocaleDateString('en-ZA', { day:'numeric', month:'long', year:'numeric' });
  return `${sStr} – ${eStr}`;
}
function fmtCurrency(n){ return 'R' + Number(n || 0).toLocaleString('en-ZA'); }
function slugify(str){ return (str || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
