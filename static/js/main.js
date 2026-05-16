'use strict';

/* ── Theme toggle ── */
document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.addEventListener('click', function() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cv-theme', next);
  });
});

/* ── Nav scroll shadow ── */
const nav = document.querySelector('body > nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 40 ? '0 1px 0 rgba(255,255,255,0.06)' : 'none';
  }, { passive: true });
}

/* ── Active nav link ── */
const currentPage = window.location.pathname;
document.querySelectorAll('nav a').forEach(link => {
  if (link.getAttribute('href') === currentPage) link.classList.add('nav-active');
});

/* ── Toast helper ── */
window.showToast = function(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
};

/* ── Card fade-in on scroll ── */
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('fade-in'); io.unobserve(entry.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.mc, .movie-card, .photo-card').forEach(el => io.observe(el));