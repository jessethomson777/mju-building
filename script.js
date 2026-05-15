/* =========================================================
   MJU Building — interactions
   ========================================================= */
(function () {
  'use strict';

  // -------- Nav scroll state + scroll spy --------
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('.nav-links a[data-target]');
  const sections = [...document.querySelectorAll('section[id]')];

  function onScroll() {
    if (window.scrollY > 8) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id;
          navLinks.forEach((a) => {
            a.classList.toggle('active', a.getAttribute('data-target') === id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach((s) => io.observe(s));
  }

  // -------- Mobile menu --------
  const toggle = document.querySelector('.nav-toggle');
  const mobile = document.querySelector('.mobile-menu');
  if (toggle && mobile) {
    toggle.addEventListener('click', () => {
      mobile.classList.toggle('open');
      document.body.style.overflow = mobile.classList.contains('open') ? 'hidden' : '';
    });
    mobile.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        mobile.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // -------- FAQ accordion --------
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach((other) => {
        other.classList.remove('open');
        const oa = other.querySelector('.faq-a');
        oa.style.maxHeight = '0px';
      });
      if (!isOpen) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  // -------- FAQ category filter --------
  const faqCats = document.querySelectorAll('.faq-cat');
  faqCats.forEach((btn) => {
    btn.addEventListener('click', () => {
      faqCats.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.cat;
      faqItems.forEach((item) => {
        const cat = item.dataset.cat;
        const show = filter === 'all' || cat === filter;
        item.style.display = show ? '' : 'none';
        if (!show) {
          item.classList.remove('open');
          item.querySelector('.faq-a').style.maxHeight = '0px';
        }
      });
    });
  });

  // -------- Gallery lightbox --------
  const tiles = document.querySelectorAll('.tile');
  const lightbox = document.querySelector('.lightbox');
  const lbImg = document.querySelector('.lightbox-img');
  const lbCaption = document.querySelector('.lightbox-caption');
  let lbIndex = 0;
  const lbItems = [...tiles].map((t) => ({
    label: t.dataset.label || 'Project',
    type: t.dataset.type || '',
    color: t.dataset.color || '#2a3140',
  }));

  function showLb(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    const item = lbItems[lbIndex];
    lbImg.style.background = `
      repeating-linear-gradient(135deg, rgba(255,255,255,.06) 0 18px, transparent 18px 36px),
      linear-gradient(135deg, ${item.color}, #0F1218)`;
    lbCaption.textContent = item.label;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  tiles.forEach((t, i) => t.addEventListener('click', () => showLb(i)));
  document.querySelector('.lightbox-close')?.addEventListener('click', closeLb);
  document.querySelector('.lightbox-nav.prev')?.addEventListener('click', () => showLb(lbIndex - 1));
  document.querySelector('.lightbox-nav.next')?.addEventListener('click', () => showLb(lbIndex + 1));
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLb(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
    if (e.key === 'ArrowRight') showLb(lbIndex + 1);
  });

  // -------- Quote form --------
  const form = document.querySelector('#quote-form');
  const success = document.querySelector('.form-success');
  const WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/twUNYfKDmsLCfojMVWnW/webhook-trigger/3abfcb63-6bcf-45aa-9dcb-e0cf5191bf8e';

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[data-required]').forEach((el) => {
        const field = el.closest('.field');
        const ok = el.value && el.value.trim().length > 0;
        if (!ok) { field.classList.add('err'); valid = false; }
        else field.classList.remove('err');
      });
      // email
      const email = form.querySelector('[name="email"]');
      if (email && email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
        email.closest('.field').classList.add('err');
        valid = false;
      }
      if (!valid) return;

      // Lock submit button during request
      const submitBtn = form.querySelector('.form-submit');
      const submitOriginal = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '.7';
        submitBtn.style.cursor = 'wait';
        submitBtn.innerHTML = 'Sending\u2026';
      }

      // Build payload
      const fd = new FormData(form);
      const payload = {
        name: (fd.get('name') || '').toString().trim(),
        phone: (fd.get('phone') || '').toString().trim(),
        email: (fd.get('email') || '').toString().trim(),
        location: (fd.get('location') || '').toString().trim(),
        service: (fd.get('service') || '').toString().trim(),
        message: (fd.get('message') || '').toString().trim(),
        source: 'mjubuilding.com.au — Quote Form',
        page: window.location.href,
        submitted_at: new Date().toISOString(),
      };

      let sent = false;
      try {
        const res = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        sent = res.ok;
      } catch (err) {
        // Network/CORS failure — fall back to no-cors so the lead still gets through
        try {
          await fetch(WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          sent = true;
        } catch (err2) {
          sent = false;
        }
      }

      if (sent) {
        form.style.display = 'none';
        success.classList.add('show');
        success.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '';
          submitBtn.style.cursor = '';
          submitBtn.innerHTML = submitOriginal;
        }
        alert("Sorry — we couldn't send your request just now. Please call Mick directly on 0459 227 461.");
      }
    });
    form.querySelectorAll('input, select, textarea').forEach((el) => {
      el.addEventListener('input', () => el.closest('.field').classList.remove('err'));
    });

    // file drop handler removed (no upload field anymore)
  }

  // -------- Smooth scroll for anchor clicks (handle nav offset) --------
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
