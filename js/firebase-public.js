// The Host with the Utmost — public-site Firebase layer
// Used by the enquiry forms (writes) and by the homepage/trips/gallery
// pages (reads) so CMS edits show up on the live site.
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
