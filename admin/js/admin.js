

function huUid(prefix){ return prefix + Math.random().toString(36).slice(2,9); }

/* Image paths are stored root-relative ("images/1.jpeg") to match the public
   site; admin pages live one level down in /admin so need "../" prepended. */
function huImg(path){
  if (!path) return '';
  return path.startsWith('../') || path.startsWith('http') ? path : '../' + path;
}
function huStripImg(path){
  return (path || '').replace(/^\.\.\//, '');
}

function huFmtDateRange(startISO, endISO){
  const opts = { day:'numeric', month:'short', year:'numeric' };
  const s = new Date(startISO), e = new Date(endISO);
  const sStr = s.toLocaleDateString('en-ZA', { day:'numeric', month:'short' });
  const eStr = e.toLocaleDateString('en-ZA', opts);
  return `${sStr} – ${eStr}`;
}
function huFmtCurrency(n){ return 'R' + Number(n || 0).toLocaleString('en-ZA'); }
function huFmtDateTime(iso){
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-ZA', { day:'numeric', month:'short' }) + ' · ' + d.toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' });
}

/* ---------------- Toasts ---------------- */
function huToast(message, opts={}){
  let stack = document.querySelector('.toast-stack');
  if (!stack){
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const t = document.createElement('div');
  t.className = 'toast' + (opts.error ? ' error' : '');
  t.innerHTML = (opts.error
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.5 2.5L16 9"/></svg>')
    + '<span>' + message + '</span>';
  stack.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(6px)'; t.style.transition='all .25s ease'; setTimeout(()=>t.remove(), 260); }, 2600);
}
function huShowPendingToast(){
  const msg = sessionStorage.getItem('hu_toast');
  if (msg){ sessionStorage.removeItem('hu_toast'); huToast(msg); }
}

/* ==========================================================
   AUTH — Firebase Authentication (email/password)
   ========================================================== */
function huRequireAuth(){
  return new Promise((resolve) => {
    auth.onAuthStateChanged(user => {
      if (!user) { location.href = 'index.html'; return; }
      resolve(user);
    });
  });
}
function huSignOut(){
  auth.signOut().then(() => { location.href = 'index.html'; });
}
async function huLogin(email, password){
  try {
    await auth.signInWithEmailAndPassword(email, password);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message.replace('Firebase: ', '') };
  }
}

/* ==========================================================
   DATA — Firestore
   ========================================================== */
function huFirestoreRequest(operation){
  return Promise.race([
    operation(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore is unavailable. Check that the default database exists for this Firebase project and that you have access.')), 10000))
  ]);
}

async function huFetchAll(){
  const [tripsSnap, testiSnap, gallerySnap, enqSnap, settingsSnap] = await huFirestoreRequest(() => Promise.all([
    db.collection('trips').get(),
    db.collection('testimonials').get(),
    db.collection('gallery').get(),
    db.collection('enquiries').get(),
    db.collection('settings').doc('site').get()
  ]));
  const toDate = (v) => (v && typeof v.toDate === 'function') ? v.toDate().toISOString() : v;

  return {
    trips: tripsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    testimonials: testiSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    gallery: gallerySnap.docs.map(d => ({ id: d.id, ...d.data() })),
    enquiries: enqSnap.docs.map(d => { const v = d.data(); return { id: d.id, ...v, createdAt: toDate(v.createdAt) }; }),
    settings: settingsSnap.exists ? settingsSnap.data() : {}
  };
}

/* --- Trips --- */
async function huSaveTrip(id, payload){
  if (id) { await huFirestoreRequest(() => db.collection('trips').doc(id).set(payload, { merge: true })); return id; }
  const ref = await huFirestoreRequest(() => db.collection('trips').add(payload));
  return ref.id;
}
async function huDeleteTrip(id){ await huFirestoreRequest(() => db.collection('trips').doc(id).delete()); }
async function huSetTripStatus(id, status){ await huFirestoreRequest(() => db.collection('trips').doc(id).update({ status })); }

/* --- Testimonials --- */
async function huSaveTestimonial(id, payload){
  if (id) { await huFirestoreRequest(() => db.collection('testimonials').doc(id).set(payload, { merge: true })); return id; }
  const ref = await huFirestoreRequest(() => db.collection('testimonials').add(payload));
  return ref.id;
}
async function huDeleteTestimonial(id){ await huFirestoreRequest(() => db.collection('testimonials').doc(id).delete()); }
async function huReorderTestimonials(orderedIds){
  const batch = db.batch();
  orderedIds.forEach((id, i) => batch.update(db.collection('testimonials').doc(id), { order: i + 1 }));
  await huFirestoreRequest(() => batch.commit());
}

/* --- Image upload (Firebase Storage) --- */
const HU_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
function huUploadImage(file){
  if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" isn't an image file.`);
  if (file.size > HU_MAX_UPLOAD_BYTES) throw new Error(`"${file.name}" is over the 10MB upload limit.`);
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  return Promise.race([
    storage.upload(path, file),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Upload of "${file.name}" timed out.`)), 30000))
  ]);
}
async function huUploadImages(files){
  const urls = [];
  for (const file of files) urls.push(await huUploadImage(file));
  return urls;
}

/* --- Gallery --- */
async function huAddGalleryImage(src, category){
  const ref = await huFirestoreRequest(() => db.collection('gallery').add({ src, category, order: Date.now() }));
  return ref.id;
}
async function huAddGalleryImages(images, category){
  const batch = db.batch();
  const refs = images.map(src => {
    const ref = db.collection('gallery').doc();
    batch.set(ref, { src, category, order: Date.now() });
    return ref;
  });
  await huFirestoreRequest(() => batch.commit());
  return refs.map(ref => ref.id);
}
async function huUpdateGalleryCategory(id, category){ await huFirestoreRequest(() => db.collection('gallery').doc(id).update({ category })); }
async function huDeleteGalleryImage(id){ await huFirestoreRequest(() => db.collection('gallery').doc(id).delete()); }
async function huReorderGallery(orderedIds){
  const batch = db.batch();
  orderedIds.forEach((id, i) => batch.update(db.collection('gallery').doc(id), { order: i + 1 }));
  await huFirestoreRequest(() => batch.commit());
}

/* --- Enquiries (huAddEnquiry is also used by the public site forms) --- */
async function huAddEnquiry(payload){
  await huFirestoreRequest(() => db.collection('enquiries').add({
    ...payload,
    status: 'new',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }));
}
async function huSetEnquiryStatus(id, status){ await huFirestoreRequest(() => db.collection('enquiries').doc(id).update({ status })); }
async function huDeleteEnquiry(id){ await huFirestoreRequest(() => db.collection('enquiries').doc(id).delete()); }

/* --- Settings --- */
async function huSaveSettings(payload){ await huFirestoreRequest(() => db.collection('settings').doc('site').set(payload, { merge: true })); }

/* --- About page content --- */
async function huFetchAbout(){
  const doc = await huFirestoreRequest(() => db.collection('settings').doc('about').get());
  return doc.exists ? doc.data() : {};
}
async function huSaveAbout(payload){ await huFirestoreRequest(() => db.collection('settings').doc('about').set(payload, { merge: true })); }

/* ---------------- Shared shell (sidebar + topbar) ---------------- */
const HU_NAV = [
  { key:'dashboard', href:'dashboard.html', label:'Dashboard', group:'Overview', icon:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="12" width="8" height="9" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/>' },
  { key:'trips', href:'trips.html', label:'Trips', group:'Content', icon:'<path d="M3 11l18-7-7 18-2-8-8-2z"/>', countKey:'trips' },
  { key:'testimonials', href:'testimonials.html', label:'Testimonials', group:'Content', icon:'<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>', countKey:'testimonials' },
  { key:'gallery', href:'gallery.html', label:'Gallery', group:'Content', icon:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="M21 15l-5-5-11 11"/>', countKey:'gallery' },
  { key:'about', href:'about.html', label:'About Page', group:'Content', icon:'<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>' },
  { key:'enquiries', href:'enquiries.html', label:'Enquiries', group:'Business', icon:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', countKey:'enquiries-new' },
  { key:'settings', href:'settings.html', label:'Settings', group:'Business', icon:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1z"/>' }
];

function huRenderShell(activeKey, crumbLabel){
  let groups = '';
  let lastGroup = null;
  HU_NAV.forEach(item => {
    if (item.group !== lastGroup){ groups += `<div class="nav-label">${item.group}</div>`; lastGroup = item.group; }
    const count = item.countKey ? `<span class="count" data-count="${item.countKey}">–</span>` : '';
    groups += `<a href="${item.href}" class="${item.key===activeKey?'active':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${item.icon}</svg>${item.label} ${count}</a>`;
  });

  const sidebarHtml = `
  <div class="sidebar-scrim"></div>
  <aside class="admin-sidebar">
    <div class="brand-lockup">
      <span class="brand-mark"><img src="../images/logo-mark.jpg" alt="Logo"></span>
      <span class="name">Host w/ Utmost<small>Admin</small></span>
    </div>
    <nav class="admin-nav">${groups}</nav>
    <div class="admin-sidebar-foot">
      <div class="admin-user">
        <div class="avatar" id="adminAvatar">P</div>
        <div class="who"><div class="n" id="adminName">Signed in</div><div class="r">Admin</div></div>
      </div>
      <button class="admin-signout" data-signout>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        Sign Out
      </button>
    </div>
  </aside>`;

  const topbarHtml = `
    <div class="admin-topbar">
      <div style="display:flex; align-items:center; gap:12px;">
        <button class="sidebar-toggle" aria-label="Toggle menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
        <div class="crumbs">${crumbLabel}</div>
      </div>
      <div class="admin-topbar-actions">
        <a href="../index.html" target="_blank" class="abtn abtn-outline">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg>
          View Live Site
        </a>
      </div>
    </div>`;

  document.getElementById('shellSidebar').outerHTML = sidebarHtml;
  document.getElementById('shellTopbar').outerHTML = topbarHtml;
  huInitSidebar();
  huBindGlobalActions();

  const user = auth.currentUser;
  if (user) {
    const nameEl = document.getElementById('adminName');
    const avatarEl = document.getElementById('adminAvatar');
    if (nameEl) nameEl.textContent = user.email;
    if (avatarEl) avatarEl.textContent = (user.email || 'A')[0].toUpperCase();
  }
}

function huUpdateNavCounts(data){
  const counts = {
    trips: data.trips.length,
    testimonials: data.testimonials.length,
    gallery: data.gallery.length,
    'enquiries-new': data.enquiries.filter(e => e.status === 'new').length
  };
  document.querySelectorAll('[data-count]').forEach(el => {
    el.textContent = counts[el.dataset.count] ?? '0';
  });
}

function huBindGlobalActions(){
  document.querySelectorAll('[data-signout]').forEach(el => { el.onclick = huSignOut; });
}

/* ---------------- Sidebar (mobile) ---------------- */
function huInitSidebar(){
  const sidebar = document.querySelector('.admin-sidebar');
  const toggle = document.querySelector('.sidebar-toggle');
  const scrim = document.querySelector('.sidebar-scrim');
  if (!sidebar || !toggle) return;
  function close(){ sidebar.classList.remove('open'); scrim && scrim.classList.remove('open'); }
  toggle.addEventListener('click', () => { sidebar.classList.toggle('open'); scrim && scrim.classList.toggle('open'); });
  scrim && scrim.addEventListener('click', close);
}

/* ---------------- Modal helpers ---------------- */
function huOpenModal(id){ document.getElementById(id)?.classList.add('open'); }
function huCloseModal(id){ document.getElementById(id)?.classList.remove('open'); }
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

/* ---------------- Confirm helper ---------------- */
let huConfirmEls = null;
function huConfirmInit(){
  if (huConfirmEls) return huConfirmEls;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box confirm-box">
      <div class="confirm-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/><path d="M10 11v6M14 11v6"/></svg>
      </div>
      <h3></h3>
      <p></p>
      <div class="confirm-actions">
        <button type="button" class="abtn abtn-outline" data-role="cancel">Cancel</button>
        <button type="button" class="abtn abtn-danger-solid" data-role="ok">Delete</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  huConfirmEls = {
    overlay,
    title: overlay.querySelector('h3'),
    message: overlay.querySelector('p'),
    cancelBtn: overlay.querySelector('[data-role="cancel"]'),
    okBtn: overlay.querySelector('[data-role="ok"]')
  };
  return huConfirmEls;
}

function huConfirm(message, opts = {}){
  const els = huConfirmInit();

  let title = message, sub = '';
  const qIdx = message.indexOf('?');
  if (qIdx !== -1 && qIdx < message.length - 1) {
    title = message.slice(0, qIdx + 1);
    sub = message.slice(qIdx + 1).trim();
  }
  els.title.textContent = opts.title || title;
  els.message.textContent = opts.message || sub || "This action can't be undone.";
  els.okBtn.textContent = opts.confirmLabel || 'Delete';
  els.overlay.classList.add('open');
  els.cancelBtn.focus();

  return new Promise((resolve) => {
    const cleanup = (result) => {
      els.overlay.classList.remove('open');
      els.okBtn.removeEventListener('click', onOk);
      els.cancelBtn.removeEventListener('click', onCancel);
      els.overlay.removeEventListener('click', onOverlay);
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onOverlay = (e) => { if (e.target === els.overlay) cleanup(false); };
    const onKey = (e) => { if (e.key === 'Escape') cleanup(false); };
    els.okBtn.addEventListener('click', onOk);
    els.cancelBtn.addEventListener('click', onCancel);
    els.overlay.addEventListener('click', onOverlay);
    document.addEventListener('keydown', onKey);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  huShowPendingToast();
});

window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || 'An admin action failed.';
  huToast(message.replace('Firebase: ', ''), { error: true });
});
