// The Host with the Utmost — shared site behavior
// Interactive behaviors use event delegation so they keep working on
// content rendered dynamically from Firestore after the initial page load.

window.HU = window.HU || {};

document.addEventListener('DOMContentLoaded', () => {

  /* Mobile nav toggle */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navBackdrop = document.querySelector('.nav-backdrop');
  function closeNav() {
    navLinks.classList.remove('open');
    navBackdrop && navBackdrop.classList.remove('open');
    document.body.classList.remove('menu-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navBackdrop && navBackdrop.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
    navBackdrop && navBackdrop.addEventListener('click', closeNav);
  }

  /* Accordions — delegated, works on content added later */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.accordion-trigger');
    if (!btn) return;
    const item = btn.closest('.accordion-item');
    const panel = item.querySelector('.accordion-panel');
    const isOpen = item.classList.contains('open');
    const parent = item.closest('.accordion');
    if (parent) {
      parent.querySelectorAll('.accordion-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.accordion-panel').style.maxHeight = null;
        }
      });
    }
    item.classList.toggle('open', !isOpen);
    panel.style.maxHeight = !isOpen ? panel.scrollHeight + 'px' : null;
  });

  /* Reveal on scroll (single elements + staggered groups) — re-observable */
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 }) : null;

  function initReveal(root = document) {
    const els = root.querySelectorAll('[data-reveal]:not(.in), [data-reveal-group]:not(.in)');
    if (io) els.forEach(el => io.observe(el));
    else els.forEach(el => el.classList.add('in'));
  }
  window.HU.initReveal = initReveal;
  initReveal();

  /* Subtle hero parallax (rAF-throttled, skipped for reduced-motion) */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parallaxImgs = document.querySelectorAll('.hero-media img, .page-hero .hero-media img');
  if (!prefersReducedMotion && parallaxImgs.length) {
    let ticking = false;
    function updateParallax() {
      parallaxImgs.forEach(img => {
        const rect = img.closest('.hero, .page-hero').getBoundingClientRect();
        const offset = Math.max(-60, Math.min(60, rect.top * -0.12));
        img.style.transform = `translateY(${offset}px) scale(1.08)`;
      });
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
    }, { passive: true });
    updateParallax();
  }

  /* Gallery category filters — delegated + re-scannable item list */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.gallery-filter');
    if (!btn) return;
    const bar = btn.closest('.gallery-filters');
    bar.querySelectorAll('.gallery-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.filter;
    document.querySelectorAll('.gallery-item').forEach(item => {
      const show = cat === 'all' || item.dataset.category === cat;
      item.classList.toggle('hide', !show);
    });
  });

  /* Lightbox gallery — delegated, re-reads group membership at click time */
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('img');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    let currentGroup = [];
    let currentIndex = 0;

    function openLightbox(group, index) {
      currentGroup = group;
      currentIndex = index;
      lbImg.src = currentGroup[currentIndex];
      lightbox.classList.add('open');
      document.body.classList.add('menu-open');
    }
    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.classList.remove('menu-open');
    }
    function step(dir) {
      currentIndex = (currentIndex + dir + currentGroup.length) % currentGroup.length;
      lbImg.src = currentGroup[currentIndex];
    }

    document.addEventListener('click', (e) => {
      const item = e.target.closest('[data-full]');
      if (!item) return;
      const groupEl = item.closest('[data-lightbox-group]');
      if (!groupEl) return;
      const items = Array.from(groupEl.querySelectorAll('[data-full]'));
      const urls = items.map(i => i.dataset.full);
      openLightbox(urls, items.indexOf(item));
    });

    closeBtn && closeBtn.addEventListener('click', closeLightbox);
    prevBtn && prevBtn.addEventListener('click', () => step(-1));
    nextBtn && nextBtn.addEventListener('click', () => step(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });
  }

  /* Enquiry forms — submit straight to Firestore (see js/firebase-public.js) */
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[data-enquiry-form]');
    if (!form) return;
    e.preventDefault();

    /* Honeypot spam check — a hidden field real users never see or fill.
       If it's filled, silently pretend success without touching Firestore. */
    const honeypot = form.querySelector('[name="company"]');
    if (honeypot && honeypot.value.trim()) {
      const success = form.parentElement.querySelector('.form-success');
      form.style.display = 'none';
      if (success) success.classList.add('show');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const errorEl = form.querySelector('.form-error');
    if (errorEl) errorEl.style.display = 'none';

    const field = (name) => form.querySelector(`[name="${name}"]`)?.value.trim() || '';
    const payload = {
      name: field('name'),
      email: field('email'),
      whatsapp: field('whatsapp'),
      trip: field('trip'),
      travellers: field('travellers') ? Number(field('travellers')) : null,
      dates: field('dates'),
      message: field('message')
    };

    if (typeof submitEnquiry !== 'function') {
      console.error('Firebase not loaded on this page — cannot submit enquiry.');
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    try {
      await submitEnquiry(payload);
      const success = form.parentElement.querySelector('.form-success');
      form.style.display = 'none';
      if (success) success.classList.add('show');
    } catch (err) {
      console.error('Enquiry submission failed:', err);
      if (errorEl) {
        errorEl.textContent = "Something went wrong sending your enquiry — please try WhatsApp instead, or try again in a moment.";
        errorEl.style.display = 'block';
      }
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  /* Pre-fill trip name on enquiry when "Enquire" clicked on a card — delegated */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-enquire-trip]');
    if (!btn) return;
    const tripSelect = document.querySelector('#enquire-trip');
    if (tripSelect) {
      tripSelect.value = btn.dataset.enquireTrip;
      document.querySelector('#enquire')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  /* Set active nav link */
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });

  /* Site-wide contact/social settings — single source of truth is the CMS
     Settings page (Firestore settings/site). Pulls the live values into
     every WhatsApp link, mailto link, social link and footer line. */
  if (typeof fetchSiteSettings === 'function') {
    fetchSiteSettings().then(applySiteSettings).catch(err => console.error('Failed to load site settings:', err));
  }
});

function applySiteSettings(settings){
  if (!settings) return;
  const waDigits = (settings.whatsapp || '').replace(/[^0-9]/g, '');
  const email = (settings.email || '').trim();
  const igHandle = (settings.instagram || '').replace(/^@/, '').trim();
  const ttHandle = (settings.tiktok || '').replace(/^@/, '').trim();

  if (waDigits) {
    document.querySelectorAll('a[href*="wa.me/"]').forEach(a => {
      a.setAttribute('href', a.getAttribute('href').replace(/wa\.me\/\d+/, `wa.me/${waDigits}`));
      if (/^\+?[\d\s]+$/.test(a.textContent.trim())) a.textContent = settings.whatsapp;
    });
  }
  if (email) {
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      a.setAttribute('href', `mailto:${email}`);
      if (a.textContent.trim().includes('@')) a.textContent = email;
    });
  }
  if (igHandle) {
    document.querySelectorAll('a[href*="instagram.com/"]').forEach(a => {
      a.setAttribute('href', `https://instagram.com/${igHandle}`);
      if (a.textContent.trim().startsWith('@')) a.textContent = '@' + igHandle;
    });
  }
  if (ttHandle) {
    document.querySelectorAll('a[href*="tiktok.com/"]').forEach(a => {
      a.setAttribute('href', `https://tiktok.com/@${ttHandle}`);
      if (a.textContent.trim().startsWith('@')) a.textContent = '@' + ttHandle;
    });
  }

  document.querySelectorAll('[data-settings-email]').forEach(el => { if (email) el.textContent = email; });
  document.querySelectorAll('[data-settings-whatsapp-text]').forEach(el => { if (settings.whatsapp) el.textContent = `WhatsApp: ${settings.whatsapp}`; });
  document.querySelectorAll('[data-settings-social-text]').forEach(el => { if (igHandle) el.innerHTML = `@${igHandle} on Instagram &amp; TikTok`; });
  document.querySelectorAll('[data-settings-address]').forEach(el => { if (settings.address) el.textContent = settings.address; });
}
