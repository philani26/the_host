// The Host with the Utmost — shared site behavior
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

  /* Accordions */
  document.querySelectorAll('.accordion-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.accordion-item');
      const panel = item.querySelector('.accordion-panel');
      const isOpen = item.classList.contains('open');
      // close siblings in same accordion
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
  });

  /* Reveal on scroll (single elements + staggered groups) */
  const revealEls = document.querySelectorAll('[data-reveal], [data-reveal-group]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

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

  /* Gallery category filters */
  const filterBtns = document.querySelectorAll('.gallery-filter');
  if (filterBtns.length) {
    const items = document.querySelectorAll('.gallery-item');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.filter;
        items.forEach(item => {
          const show = cat === 'all' || item.dataset.category === cat;
          item.classList.toggle('hide', !show);
        });
      });
    });
  }

  /* Lightbox gallery */
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

    document.querySelectorAll('[data-lightbox-group]').forEach(groupEl => {
      const items = Array.from(groupEl.querySelectorAll('[data-full]'));
      const urls = items.map(i => i.dataset.full);
      items.forEach((item, idx) => {
        item.addEventListener('click', () => openLightbox(urls, idx));
      });
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

  /* Enquiry forms — client-side only (no backend wired up) */
  document.querySelectorAll('form[data-enquiry-form]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
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
  });

  /* Pre-fill trip name on enquiry when "Enquire" clicked on a card */
  document.querySelectorAll('[data-enquire-trip]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tripSelect = document.querySelector('#enquire-trip');
      if (tripSelect) {
        tripSelect.value = btn.dataset.enquireTrip;
        document.querySelector('#enquire')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* Set active nav link */
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });
});
