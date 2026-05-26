'use strict';

/* ══════════════════════════════════════════════════
   CineVault — main.js  (Refactored)
   Handles: theme · nav · toast · scroll animations
            cursor glow · particle burst · stagger
            count-up · stats bar · hero float
            page transitions · magnetic buttons
            ripple clicks · tilt cards
══════════════════════════════════════════════════ */

// ── Page entry fade ───────────────────────────────
document.documentElement.style.opacity = '0';
document.documentElement.style.transition = 'opacity 0.4s ease';
window.addEventListener('load', () => {
  requestAnimationFrame(() => {
    document.documentElement.style.opacity = '1';
  });
});

// ── Theme ────────────────────────────────────────
function initTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  // Apply saved theme immediately (also done inline, this is a safety net)
  const saved = localStorage.getItem('cv-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cv-theme', next);

    // Brief flash animation on button
    btn.style.transform = 'rotate(360deg) scale(1.15)';
    setTimeout(() => { btn.style.transform = ''; }, 400);
  });
}

// ── Nav scroll shadow + active link ──────────────
function initNav() {
  const nav = document.querySelector('body > nav');
  if (!nav) return;

  const onScroll = () => {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
    entries.forEach((entry, idx) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      // Slight stagger for siblings in the same batch
      const delay = el.dataset.revealDelay || 0;
      setTimeout(() => {
        el.classList.add('cv-revealed');
      }, parseFloat(delay) * 1000);
      io.unobserve(el);
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -36px 0px' });

  document.querySelectorAll('.mc, .movie-card, .photo-card, .cv-reveal').forEach((el, i) => {
    el.classList.add('cv-will-reveal');
    // Auto-stagger cards that are direct siblings
    const parent = el.parentElement;
    if (parent) {
      const siblings = [...parent.querySelectorAll('.mc, .movie-card, .photo-card')];
      const idx = siblings.indexOf(el);
      if (idx > 0) el.dataset.revealDelay = (idx * 0.055).toFixed(3);
    }
    io.observe(el);
  });
}

// ── Staggered children via data-stagger ──────────
function initStagger() {
  document.querySelectorAll('[data-stagger]').forEach(parent => {
    const delay = parseFloat(parent.dataset.stagger) || 0.07;
    Array.from(parent.children).forEach((child, i) => {
      child.style.animationDelay = `${i * delay}s`;
    });
  });
}

// ── Genre card 3-D tilt ───────────────────────────
function initCardTilt() {
  document.querySelectorAll('.mc').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform =
        `translateY(-14px) scale(1.035) rotateX(${-y * 9}deg) rotateY(${x * 9}deg)`;
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
      const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 12;
      const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 12;
      cover.style.transform = `scale(1.1) translate(${x}px, ${y}px)`;
    });
    card.addEventListener('mouseleave', () => {
      cover.style.transform = '';
    });
  });
}

// ── Magnetic buttons ──────────────────────────────
function initMagneticButtons() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.play-btn, .pin-submit, .form-btn-save').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) * 0.28;
      const dy = (e.clientY - cy) * 0.28;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.5s cubic-bezier(.34,1.56,.64,1)';
      setTimeout(() => { btn.style.transition = ''; }, 500);
    });
  });
}

// ── Ripple click effect ───────────────────────────
function initRipple() {
  document.querySelectorAll('.nbtn, .mact-btn, .pin-btn, .form-btn').forEach(btn => {
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.addEventListener('click', function(e) {
      const rect   = this.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height) * 1.4;
      const x      = e.clientX - rect.left - size / 2;
      const y      = e.clientY - rect.top  - size / 2;
      const ripple = document.createElement('span');
      Object.assign(ripple.style, {
        position:     'absolute',
        width:        `${size}px`,
        height:       `${size}px`,
        left:         `${x}px`,
        top:          `${y}px`,
        background:   'rgba(255,255,255,0.15)',
        borderRadius: '50%',
        transform:    'scale(0)',
        animation:    'rippleAnim 0.55s ease-out forwards',
        pointerEvents:'none',
      });
      this.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // Inject ripple keyframe once
  if (!document.getElementById('cv-ripple-style')) {
    const s = document.createElement('style');
    s.id = 'cv-ripple-style';
    s.textContent = `
      @keyframes rippleAnim {
        to { transform: scale(1); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }
}

// ── Cursor glow (desktop only) ────────────────────
function initCursorGlow() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const glow = document.createElement('div');
  glow.id = 'cv-cursor-glow';
  document.body.appendChild(glow);

  let mx = -400, my = -400;
  let cx = -400, cy = -400;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { glow.style.opacity = '1'; });

  // Morph colour near interactive elements
  document.addEventListener('mouseover', e => {
    const el = e.target.closest('a, button, .mc, .movie-card, .photo-card');
    if (el) {
      glow.style.background =
        'radial-gradient(circle, rgba(166,108,255,0.14) 0%, rgba(255,107,157,0.06) 40%, transparent 70%)';
      glow.style.width  = '480px';
      glow.style.height = '480px';
    } else {
      glow.style.background =
        'radial-gradient(circle, rgba(166,108,255,0.07) 0%, rgba(166,108,255,0.03) 40%, transparent 70%)';
      glow.style.width  = '380px';
      glow.style.height = '380px';
    }
  });

  function tick() {
    cx += (mx - cx) * 0.1;
    cy += (my - cy) * 0.1;
    glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  tick();
}

// ── Particle burst on movie card click ───────────
function initParticleBurst() {
  document.querySelectorAll('.movie-card .movie-cover').forEach(cover => {
    cover.addEventListener('click', e => burst(e.clientX, e.clientY), { passive: true });
  });
}

function burst(x, y) {
  const palette = ['#A66CFF','#FF6B9D','#FFD166','#5BA8FF','#06D6A0','#E84545','#FF6B35','#4ECDC4'];
  const count   = 14;
  for (let i = 0; i < count; i++) {
    const p     = document.createElement('span');
    p.className = 'cv-particle';
    const angle = (i / count) * Math.PI * 2;
    const dist  = 45 + Math.random() * 70;
    const dx    = Math.cos(angle) * dist;
    const dy    = Math.sin(angle) * dist;
    const size  = 4 + Math.random() * 7;
    const color = palette[Math.floor(Math.random() * palette.length)];
    Object.assign(p.style, {
      left:       `${x}px`,
      top:        `${y}px`,
      width:      `${size}px`,
      height:     `${size}px`,
      background: color,
      '--dx':     `${dx}px`,
      '--dy':     `${dy}px`,
    });
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
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
      const dec   = end % 1 !== 0 ? 1 : 0;
      const dur   = 1400;
      const start = performance.now();
      function step(now) {
        const t    = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
        el.textContent = (ease * end).toFixed(dec);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => {
    el.dataset.count = el.textContent.trim();
    el.textContent   = '0';
    io.observe(el);
  });
}

// ── Stats bar pop-in on scroll ────────────────────
function initStatsBar() {
  const bar = document.querySelector('.stats-bar');
  if (!bar) return;
  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      bar.classList.add('stats-visible');
      io.disconnect();
    }
  }, { threshold: 0.25 });
  io.observe(bar);
}

// ── Hero ambient parallax ─────────────────────────
function initHeroFloat() {
  const bg = document.querySelector('.hero-bg');
  if (!bg) return;
  let ticking = false;
  document.addEventListener('mousemove', e => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth  - 0.5) * 22;
      const y = (e.clientY / window.innerHeight - 0.5) * 14;
      bg.style.transform = `translate(${x}px, ${y}px) scale(1.06)`;
      ticking = false;
    });
  }, { passive: true });
}

// ── Page transition links ─────────────────────────
function initPageTransitions() {
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    // Only internal same-origin links, skip anchors/modals
    if (!href || href.startsWith('#') || href.startsWith('javascript') ||
        href.startsWith('http') || href.startsWith('mailto')) return;
    link.addEventListener('click', e => {
      e.preventDefault();
      document.documentElement.style.transition = 'opacity 0.28s ease';
      document.documentElement.style.opacity    = '0';
      setTimeout(() => { window.location.href = href; }, 290);
    });
  });
}

// ── PIN dot pulse on fill ─────────────────────────
function initPinAnimations() {
  const dots = document.querySelectorAll('.pin-dot');
  if (!dots.length) return;

  // Observe class changes to animate newly-filled dots
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      if (m.attributeName === 'class') {
        const el = m.target;
        if (el.classList.contains('filled')) {
          el.style.transform = 'scale(1.4)';
          setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);
        }
      }
    });
  });
  dots.forEach(d => {
    d.style.transition = 'background 0.15s, border-color 0.15s, transform 0.2s cubic-bezier(.34,1.56,.64,1)';
    observer.observe(d, { attributes: true });
  });

  // Wrong PIN shake
  const form = document.getElementById('pinForm');
  if (form) {
    const errorEl = document.querySelector('.error-msg');
    if (errorEl) {
      const wrap = document.querySelector('.lock-wrap');
      if (wrap) {
        wrap.style.animation = 'shake 0.45s ease both';
        if (!document.getElementById('cv-shake-style')) {
          const s = document.createElement('style');
          s.id = 'cv-shake-style';
          s.textContent = `
            @keyframes shake {
              0%,100%{transform:translateX(0)}
              15%{transform:translateX(-8px)}
              30%{transform:translateX(7px)}
              45%{transform:translateX(-6px)}
              60%{transform:translateX(5px)}
              75%{transform:translateX(-3px)}
              90%{transform:translateX(2px)}
            }
          `;
          document.head.appendChild(s);
        }
      }
    }
  }
}

// ── Upload zone pulse ─────────────────────────────
function initUploadZone() {
  const zone = document.getElementById('uploadZone');
  if (!zone) return;

  // Pulse border when empty and waiting
  let pulseTimer = setInterval(() => {
    zone.style.borderColor = 'rgba(var(--accent-rgb, 166,108,255), 0.55)';
    setTimeout(() => { zone.style.borderColor = ''; }, 900);
  }, 2200);

  // Stop pulsing once user picks files
  zone.addEventListener('change', () => clearInterval(pulseTimer), { once: true, capture: true });
}

// ── Movie card accent border on hover ─────────────
function initMovieCardAccent() {
  document.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = 'rgba(var(--accent-rgb, 166,108,255), 0.35)';
      card.style.boxShadow   = '0 20px 55px rgba(0,0,0,0.65), 0 0 0 1px rgba(var(--accent-rgb,166,108,255),0.15)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = '';
      card.style.boxShadow   = '';
    });
  });
}

// ── Section title reveal underline ───────────────
function initSectionReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('cv-section-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.section-header').forEach(el => {
    io.observe(el);
  });
}

// ── Boot ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initScrollReveal();
  initStagger();
  initCardTilt();
  initMovieCardHover();
  initMovieCardAccent();
  initMagneticButtons();
  initRipple();
  initCursorGlow();
  initParticleBurst();
  initCountUp();
  initStatsBar();
  initHeroFloat();
  initPageTransitions();
  initPinAnimations();
  initUploadZone();
  initSectionReveal();
});
