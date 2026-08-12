/* The Host with the Utmost — Admin CMS shell
   Front-end only for now: all data lives in localStorage. No server, no real auth.
   This exists to validate the CMS UX before wiring it to a real backend. */

const HU_STORE_KEY = 'hu_admin_data_v1';
const HU_AUTH_KEY = 'hu_admin_authed';

const HU_SEED = {
  trips: [
    { id:'t1', destination:'Zanzibar', tagline:'Island Escape', dateStart:'2027-03-23', dateEnd:'2027-03-30', price:23000, deposit:2300, status:'published',
      hero:'../images/13.jpeg', gallery:['../images/13.jpeg','../images/16.jpeg','../images/4.jpeg','../images/6.jpeg'],
      included:['7 nights beachfront accommodation, shared occupancy','Daily breakfast & 3 group dinners','Sunset dhow cruise & Stone Town tour','Airport transfers & on-ground host','Welcome gift & community WhatsApp group'],
      excluded:['International flights','Travel insurance & visa fees','Optional excursions & spa treatments','Personal spending & gratuities'],
      paymentPlan:['R2,300 deposit to secure your spot','Balance split into monthly instalments','Final payment due 30 days before departure'] },
    { id:'t2', destination:'Mauritius', tagline:'Beach & Bliss', dateStart:'2027-04-29', dateEnd:'2027-05-04', price:27000, deposit:2700, status:'published',
      hero:'../images/16.jpeg', gallery:['../images/16.jpeg','../images/5.jpeg','../images/7.jpeg','../images/8.jpeg'],
      included:['5 nights beachfront resort, shared occupancy','Daily breakfast & 2 group dinners','Catamaran cruise with lunch','Airport transfers & on-ground host','Welcome gift & community WhatsApp group'],
      excluded:['International flights','Travel insurance & visa fees','Spa treatments & optional water sports','Personal spending & gratuities'],
      paymentPlan:['R2,700 deposit to secure your spot','Balance split into monthly instalments','Final payment due 30 days before departure'] },
    { id:'t3', destination:'Kenya', tagline:'Safari & Soul', dateStart:'2027-06-25', dateEnd:'2027-06-30', price:24000, deposit:2400, status:'published',
      hero:'../images/18.jpeg', gallery:['../images/18.jpeg','../images/10.jpeg','../images/9.jpeg','../images/17.jpeg'],
      included:['5 nights safari lodge, shared occupancy','All meals & 2 game drives daily','Maasai village cultural visit','Airport transfers & on-ground host','Welcome gift & community WhatsApp group'],
      excluded:['International flights','Travel insurance, visa & park fees','Hot air balloon safari (optional add-on)','Personal spending & gratuities'],
      paymentPlan:['R2,400 deposit to secure your spot','Balance split into monthly instalments','Final payment due 30 days before departure'] },
    { id:'t4', destination:'Turkey', tagline:'History & Hammams', dateStart:'2027-10-15', dateEnd:'2027-10-21', price:33000, deposit:3300, status:'published',
      hero:'../images/3.jpeg', gallery:['../images/3.jpeg','../images/1.jpeg','../images/6.jpeg','../images/11.jpeg'],
      included:['6 nights across Istanbul & Cappadocia, shared occupancy','Daily breakfast & 3 group dinners','Hot air balloon ride & guided old-city tour','Domestic flight & all transfers','Welcome gift & community WhatsApp group'],
      excluded:['International flights','Travel insurance & visa fees','Turkish hammam spa experience (optional add-on)','Personal spending & gratuities'],
      paymentPlan:['R3,300 deposit to secure your spot','Balance split into monthly instalments','Final payment due 30 days before departure'] },
    { id:'t5', destination:'Bali', tagline:'Wellness & Wonder', dateStart:'2027-11-12', dateEnd:'2027-11-18', price:35000, deposit:3500, status:'published',
      hero:'../images/4.jpeg', gallery:['../images/4.jpeg','../images/5.jpeg','../images/7.jpeg','../images/2.jpeg'],
      included:['6 nights boutique villa, shared occupancy','Daily breakfast & 3 group dinners','Sunrise temple tour & rice terrace hike','One spa & wellness session','Airport transfers, welcome gift & community group'],
      excluded:['International flights','Travel insurance & visa fees','Additional spa treatments','Personal spending & gratuities'],
      paymentPlan:['R3,500 deposit to secure your spot','Balance split into monthly instalments','Final payment due 30 days before departure'] },
    { id:'t6', destination:'Morocco', tagline:'Desert & Dunes', dateStart:'2028-02-10', dateEnd:'2028-02-16', price:29000, deposit:2900, status:'draft',
      hero:'../images/19.jpeg', gallery:['../images/19.jpeg','../images/20.jpeg'],
      included:['Riad accommodation in Marrakech','Sahara desert overnight camp','Daily breakfast'],
      excluded:['International flights','Visa fees'],
      paymentPlan:['R2,900 deposit to secure your spot'] },
    { id:'t7', destination:'Seychelles', tagline:'Barefoot Luxury', dateStart:'2025-05-10', dateEnd:'2025-05-16', price:31000, deposit:3100, status:'archived',
      hero:'../images/16.jpeg', gallery:['../images/16.jpeg'],
      included:['6 nights beachfront villa'], excluded:['International flights'], paymentPlan:['R3,100 deposit'] }
  ],
  testimonials: [
    { id:'r1', text:"I booked solo and left with five new best friends. The Host with the Utmost thinks of everything.", name:'Kayleen M.', location:'Zanzibar Trip, 2025', rating:5, status:'published', order:1, avatar:'../images/17.jpeg' },
    { id:'r2', text:"From the welcome gift to the last dinner, every detail felt personal. This is travel done right.", name:'Naledi K.', location:'Cape Winelands, 2025', rating:5, status:'published', order:2, avatar:'../images/2.jpeg' },
    { id:'r3', text:"Elegant, warm and effortless — exactly the soft landing I needed after a hard year.", name:'Rethabile S.', location:'Franschhoek, 2025', rating:5, status:'published', order:3, avatar:'../images/9.jpeg' },
    { id:'r4', text:"Still smiling about the Valley of Waves trip months later. Already saving for the next one.", name:'Buhle N.', location:'Sun City, 2026', rating:5, status:'draft', order:4, avatar:'../images/22.jpeg' }
  ],
  gallery: [
    { id:'g1', src:'../images/13.jpeg', category:'destinations', order:1 },
    { id:'g2', src:'../images/18.jpeg', category:'destinations', order:2 },
    { id:'g3', src:'../images/9.jpeg', category:'destinations', order:3 },
    { id:'g4', src:'../images/21.jpeg', category:'destinations', order:4 },
    { id:'g5', src:'../images/19.jpeg', category:'destinations', order:5 },
    { id:'g6', src:'../images/16.jpeg', category:'trips', order:1 },
    { id:'g7', src:'../images/4.jpeg', category:'trips', order:2 },
    { id:'g8', src:'../images/2.jpeg', category:'group', order:1 },
    { id:'g9', src:'../images/17.jpeg', category:'group', order:2 },
    { id:'g10', src:'../images/15.jpeg', category:'group', order:3 },
    { id:'g11', src:'../images/23.jpeg', category:'group', order:4 },
    { id:'g12', src:'../images/6.jpeg', category:'accommodation', order:1 },
    { id:'g13', src:'../images/7.jpeg', category:'accommodation', order:2 },
    { id:'g14', src:'../images/24.jpeg', category:'accommodation', order:3 },
    { id:'g15', src:'../images/11.jpeg', category:'activities', order:1 },
    { id:'g16', src:'../images/8.jpeg', category:'activities', order:2 },
    { id:'g17', src:'../images/10.jpeg', category:'activities', order:3 },
    { id:'g18', src:'../images/20.jpeg', category:'activities', order:4 },
    { id:'g19', src:'../images/1.jpeg', category:'events', order:1 },
    { id:'g20', src:'../images/3.jpeg', category:'events', order:2 },
    { id:'g21', src:'../images/5.jpeg', category:'community', order:1 },
    { id:'g22', src:'../images/22.jpeg', category:'community', order:2 }
  ],
  enquiries: [
    { id:'e1', name:'Thandiwe Mokoena', email:'thandiwe@example.com', whatsapp:'+27 82 123 4567', trip:'Zanzibar (23–30 March 2027)', travellers:2, dates:'March 2027', message:'Keen to join with my sister, are there still spots?', status:'new', createdAt:'2026-08-09T09:12:00' },
    { id:'e2', name:'Lerato Dlamini', email:'lerato@example.com', whatsapp:'+27 83 555 1122', trip:'Mauritius (29 April–4 May 2027)', travellers:1, dates:'Flexible', message:'', status:'contacted', createdAt:'2026-08-07T14:40:00' },
    { id:'e3', name:'Amahle Zulu', email:'amahle@example.com', whatsapp:'+27 71 998 4433', trip:'Travel Concierge Service', travellers:1, dates:'September 2026', message:'Need help with a visa for Portugal.', status:'new', createdAt:'2026-08-11T18:05:00' },
    { id:'e4', name:'Palesa Nkosi', email:'palesa@example.com', whatsapp:'+27 84 220 9081', trip:'Bali (12–18 November 2027)', travellers:3, dates:'November 2027', message:'Traveling with two friends, can we get a group rate?', status:'closed', createdAt:'2026-07-29T11:22:00' }
  ],
  settings: {
    email: 'hello@hostwiththeutmost.com',
    whatsapp: '+27 73 442 6770',
    instagram: '@hostwiththeutmost',
    tiktok: '@hostwiththeutmost',
    address: 'South Africa — hosting trips across Africa and beyond',
    tagline: "Not just a trip, it's an utmost experience."
  }
};

function huLoad(){
  try {
    const raw = localStorage.getItem(HU_STORE_KEY);
    if (!raw) { huSave(HU_SEED); return structuredClone(HU_SEED); }
    return JSON.parse(raw);
  } catch(e){ return structuredClone(HU_SEED); }
}
function huSave(data){ localStorage.setItem(HU_STORE_KEY, JSON.stringify(data)); }
function huResetDemo(){ localStorage.removeItem(HU_STORE_KEY); location.reload(); }
function huUid(prefix){ return prefix + Math.random().toString(36).slice(2,9); }

function huFmtDateRange(startISO, endISO){
  const opts = { day:'numeric', month:'short', year:'numeric' };
  const s = new Date(startISO), e = new Date(endISO);
  const sStr = s.toLocaleDateString('en-ZA', { day:'numeric', month:'short' });
  const eStr = e.toLocaleDateString('en-ZA', opts);
  return `${sStr} – ${eStr}`;
}
function huFmtCurrency(n){ return 'R' + Number(n).toLocaleString('en-ZA'); }
function huFmtDateTime(iso){
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

/* ---------------- Shared shell (sidebar + topbar) ---------------- */
const HU_NAV = [
  { key:'dashboard', href:'dashboard.html', label:'Dashboard', group:'Overview', icon:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="12" width="8" height="9" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/>' },
  { key:'trips', href:'trips.html', label:'Trips', group:'Content', icon:'<path d="M3 11l18-7-7 18-2-8-8-2z"/>', countKey:'trips' },
  { key:'testimonials', href:'testimonials.html', label:'Testimonials', group:'Content', icon:'<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>', countKey:'testimonials' },
  { key:'gallery', href:'gallery.html', label:'Gallery', group:'Content', icon:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="M21 15l-5-5-11 11"/>', countKey:'gallery' },
  { key:'enquiries', href:'enquiries.html', label:'Enquiries', group:'Business', icon:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', countKey:'enquiries-new' },
  { key:'settings', href:'settings.html', label:'Settings', group:'Business', icon:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1z"/>' }
];

function huRenderShell(activeKey, crumbLabel){
  const data = huLoad();
  const counts = {
    trips: data.trips.length,
    testimonials: data.testimonials.length,
    gallery: data.gallery.length,
    'enquiries-new': data.enquiries.filter(e => e.status==='new').length
  };
  let groups = '';
  let lastGroup = null;
  HU_NAV.forEach(item => {
    if (item.group !== lastGroup){ groups += `<div class="nav-label">${item.group}</div>`; lastGroup = item.group; }
    const count = item.countKey ? `<span class="count">${counts[item.countKey]}</span>` : '';
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
        <div class="avatar">P</div>
        <div class="who"><div class="n">Promise Thom</div><div class="r">Founder / Admin</div></div>
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
}

function huBindGlobalActions(){
  document.querySelectorAll('[data-signout]').forEach(el => { el.onclick = huSignOut; });
  document.querySelectorAll('[data-reset-demo]').forEach(el => { el.onclick = () => {
    if (huConfirm('Reset all CMS demo data back to the seeded sample content?')) huResetDemo();
  }; });
}

/* ---------------- Auth guard (demo only — no real backend) ---------------- */
function huRequireAuth(){
  if (document.body.dataset.page === 'login') return;
  if (sessionStorage.getItem(HU_AUTH_KEY) !== '1') {
    location.href = 'index.html';
  }
}
function huSignOut(){
  sessionStorage.removeItem(HU_AUTH_KEY);
  location.href = 'index.html';
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

/* ---------------- Confirm helper (simple, no backend) ---------------- */
function huConfirm(message){ return window.confirm(message); }

function huShowPendingToast(){
  const msg = sessionStorage.getItem('hu_toast');
  if (msg){ sessionStorage.removeItem('hu_toast'); huToast(msg); }
}

document.addEventListener('DOMContentLoaded', () => {
  huRequireAuth();
  huInitSidebar();
  huBindGlobalActions();
  huShowPendingToast();
});
