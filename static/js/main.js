'use strict';

/* ══════════════════════════════════════════════════
   CineVault — main.js
   Handles: theme, nav, toast, scroll animations,
            cursor glow, particle burst, stagger reveals
══════════════════════════════════════════════════ */

// ── Theme ────────────────────────────────────────
function initTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cv-theme', next);
  });
}

// ── Nav scroll shadow ─────────────────────────────
function initNav() {
  const nav = document.querySelector('body > nav');
  if (!nav) return;
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // apply on load if already scrolled

  // Active link highlight
  const path = window.location.pathname;
  document.querySelectorAll('nav a').forEach(link => {
    if (link.getAttribute('href') === path) link.classList.add('nav-active');
  });
}

// ── Toast ─────────────────────────────────────────
window.showToast = function(msg, duration = 2800) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
};

// ── Scroll-triggered fade-in ──────────────────────
function initScrollReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('cv-revealed');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.mc, .movie-card, .photo-card, .cv-reveal').forEach(el => {
    el.classList.add('cv-will-reveal');
    io.observe(el);
  });
}

// ── Staggered children reveal ─────────────────────
function initStagger() {
  document.querySelectorAll('[data-stagger]').forEach(parent => {
    const delay = parseFloat(parent.dataset.stagger) || 0.07;
    Array.from(parent.children).forEach((child, i) => {
      child.style.animationDelay = `${i * delay}s`;
    });
  });
}

// ── Genre card tilt effect ────────────────────────
function initCardTilt() {
  document.querySelectorAll('.mc').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-12px) scale(1.03) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ── Movie card subtle parallax cover ─────────────
function initMovieCardHover() {
  document.querySelectorAll('.movie-card').forEach(card => {
    const cover = card.querySelector('.movie-cover img, .movie-cover video');
    if (!cover) return;
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 10;
      const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 10;
      cover.style.transform = `scale(1.08) translate(${x}px, ${y}px)`;
    });
    card.addEventListener('mouseleave', () => {
      cover.style.transform = '';
    });
  });
}

// ── Cursor glow (desktop only) ────────────────────
function initCursorGlow() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const glow = document.createElement('div');
  glow.id = 'cv-cursor-glow';
  document.body.appendChild(glow);

  let mx = -200, my = -200;
  let cx = -200, cy = -200;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { glow.style.opacity = '1'; });

  function tick() {
    cx += (mx - cx) * 0.12;
    cy += (my - cy) * 0.12;
    glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  tick();
}

// ── Particle burst on movie card click ───────────
function initParticleBurst() {
  document.querySelectorAll('.movie-card .movie-cover').forEach(cover => {
    cover.addEventListener('click', e => {
      burst(e.clientX, e.clientY);
    }, { passive: true });
  });
}

function burst(x, y) {
  const colors = ['#A66CFF', '#FF6B9D', '#FFD166', '#5BA8FF', '#06D6A0', '#E84545'];
  for (let i = 0; i < 12; i++) {
    const p     = document.createElement('span');
    p.className = 'cv-particle';
    const angle = (i / 12) * Math.PI * 2;
    const dist  = 40 + Math.random() * 60;
    const size  = 4 + Math.random() * 6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    Object.assign(p.style, {
      left:       `${x}px`,
      top:        `${y}px`,
      width:      `${size}px`,
      height:     `${size}px`,
      background: color,
      '--dx':     `${Math.cos(angle) * dist}px`,
      '--dy':     `${Math.sin(angle) * dist}px`,
    });
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}

// ── Number count-up animation ─────────────────────
function initCountUp() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el  = entry.target;
      const end = parseFloat(el.dataset.count);
      if (isNaN(end)) return;
      io.unobserve(el);
      const isDecimal = end % 1 !== 0;
      const dur = 1200;
      const start = performance.now();
      function step(now) {
        const t    = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        el.textContent = isDecimal ? (ease * end).toFixed(1) : Math.round(ease * end);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => {
    const raw = el.textContent.trim();
    // Only animate pure numbers — skip strings like "4.2★" or "—"
    const num = parseFloat(raw);
    if (!isNaN(num) && String(num) === raw) {
      el.dataset.count = raw;
      el.textContent = '0';
      io.observe(el);
    }
  });
}

// ── Stats bar shimmer on scroll-in ────────────────
function initStatsBar() {
  const bar = document.querySelector('.stats-bar');
  if (!bar) return;
  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      bar.classList.add('stats-visible');
      io.disconnect();
    }
  }, { threshold: 0.3 });
  io.observe(bar);
}

// ── Hero ambient float ────────────────────────────
function initHeroFloat() {
  const bg = document.querySelector('.hero-bg');
  if (!bg) return;
  document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth  - 0.5) * 18;
    const y = (e.clientY / window.innerHeight - 0.5) * 12;
    bg.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
  }, { passive: true });
}

// ── PIN feedback toasts ───────────────────────────
function initPinFeedback() {
  // Injected by index route into a meta tag to avoid inline script CSP issues
  const meta = document.querySelector('meta[name="cv-pin-msg"]');
  if (!meta) return;
  const msg = meta.content;
  if (msg === 'changed')       showToast('✅ PIN changed successfully');
  else if (msg === 'removed')  showToast('🔓 PIN protection removed');
  else if (msg === 'wrong')    showToast('❌ Wrong PIN — please try again');
  else if (msg === 'invalid')  showToast('❌ New PIN must be at least 4 digits');
}

// ── Boot ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initScrollReveal();
  initStagger();
  initCardTilt();
  initMovieCardHover();
  initCursorGlow();
  initParticleBurst();
  initCountUp();
  initStatsBar();
  initHeroFloat();
  initPinFeedback();
});
