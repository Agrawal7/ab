'use strict';

/* ==========================================================
   MUSIC CONFIG
   ----------------------------------------------------------
   The birthday track lives in this folder as "audio.mp4".
   Replace that file with another song, or update the name
   below if you rename it. Music never autoplays. It starts
   only after the envelope is opened or the button is clicked.
   ========================================================== */
const MUSIC_SRC = 'audio.mp4';

/* ==========================================================
   HELPERS
   ========================================================== */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const musicAudio = new Audio(MUSIC_SRC);
musicAudio.loop = true;
musicAudio.volume = 0.35;
musicAudio.preload = 'none';

let musicHintTimer = 0;
let musicFailed = false;
let announceMusicFailure = false;

function setMusicUI(isPlaying) {
  const toggle = document.getElementById('musicToggle');
  if (!toggle) return;

  toggle.classList.toggle('playing', isPlaying);
  toggle.setAttribute('aria-pressed', String(isPlaying));
  toggle.setAttribute('aria-label', isPlaying ? 'Pause background music' : 'Play background music');
  toggle.title = isPlaying ? 'Pause music' : 'Play music';

  const icon = toggle.querySelector('.music-icon');
  if (icon) icon.textContent = isPlaying ? '🔊' : '🎵';
}

function showMusicHint(message) {
  const hint = document.getElementById('musicHint');
  if (!hint) return;

  window.clearTimeout(musicHintTimer);
  hint.textContent = message;
  hint.classList.add('show');
  musicHintTimer = window.setTimeout(() => hint.classList.remove('show'), 4200);
}

function startMusic(announceFailure = false) {
  if (!musicAudio) return;

  announceMusicFailure = announceFailure;

  if (musicFailed || musicAudio.error) {
    if (!announceFailure) {
      setMusicUI(false);
      return;
    }

    // Let the user retry after adding or replacing the audio file.
    musicFailed = false;
    try {
      musicAudio.load();
    } catch {
      // Ignore load errors; the play attempt below handles the failure.
    }
  }

  try {
    const playPromise = musicAudio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        setMusicUI(false);
        if (announceFailure) {
          showMusicHint(`Could not play "${MUSIC_SRC}". Check that the file exists in the project folder.`);
        }
      });
    }
  } catch {
    setMusicUI(false);
    if (announceFailure) {
      showMusicHint(`Could not play "${MUSIC_SRC}". Check that the file exists in the project folder.`);
    }
  }
}

/* ==========================================================
   ENVELOPE INTRO
   ========================================================== */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const envelope = document.querySelector('.envelope-wrapper');
  const mainContent = document.getElementById('mainContent');
  if (!preloader || !mainContent) return;

  document.body.classList.add('intro-active');

  let opened = false;

  function openEnvelope() {
    if (opened) return;
    opened = true;

    envelope?.classList.add('open');
    startMusic();

    const delay = reducedMotion.matches ? 250 : 1100;

    window.setTimeout(() => {
      preloader.classList.add('hidden');
      preloader.setAttribute('aria-hidden', 'true');
      mainContent.classList.add('visible');
      document.body.classList.remove('intro-active');
      mainContent.focus({ preventScroll: true });
      initScrollReveal();
    }, delay);
  }

  preloader.addEventListener('click', openEnvelope);
  preloader.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEnvelope();
    }
  });
}

/* ==========================================================
   SCROLL REVEAL
   ========================================================== */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    reveals.forEach((element) => element.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach((element) => observer.observe(element));
}

/* ==========================================================
   GIFT BOX
   ========================================================== */
function initGiftBox() {
  const giftBox = document.getElementById('giftBox');
  const giftMessage = document.getElementById('giftMessage');
  if (!giftBox || !giftMessage) return;

  let opened = false;

  function openGift() {
    if (opened) return;
    opened = true;

    giftBox.classList.add('opened');
    giftBox.setAttribute('aria-expanded', 'true');
    giftBox.setAttribute('aria-label', 'Gift opened');

    window.setTimeout(() => {
      giftMessage.classList.add('show');
      giftMessage.setAttribute('aria-hidden', 'false');
    }, 420);

    if (!reducedMotion.matches) {
      window.setTimeout(() => burstConfetti(55), 350);
    }
  }

  giftBox.addEventListener('click', openGift);
  giftBox.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openGift();
    }
  });
}

/* ==========================================================
   CAKE / CANDLE BLOWING
   ========================================================== */
function initWishButton() {
  const button = document.getElementById('wishBtn');
  const cakeStage = document.getElementById('cakeStage');
  const wishReveal = document.getElementById('wishReveal');
  if (!button || !cakeStage || !wishReveal) return;

  let blown = false;

  button.addEventListener('click', () => {
    if (blown) return;
    blown = true;

    cakeStage.classList.add('blown');
    cakeStage.setAttribute('aria-label', 'A three-tier birthday cake with seven extinguished candles');

    button.disabled = true;

    const label = button.querySelector('.btn-text');
    if (label) label.textContent = 'Wish Made 🤍';

    if (!reducedMotion.matches) {
      window.setTimeout(() => burstConfetti(110), 420);
    }

    window.setTimeout(() => {
      wishReveal.classList.add('show');
      wishReveal.setAttribute('aria-hidden', 'false');
    }, reducedMotion.matches ? 100 : 900);
  });
}

/* ==========================================================
   CONFETTI
   ========================================================== */
function burstConfetti(count = 100) {
  if (reducedMotion.matches) return;

  const colors = ['#ff8fba', '#ffd4e4', '#f6d28b', '#d9c6f0', '#ffffff', '#d9699a'];
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement('span');
    const size = 6 + Math.random() * 8;

    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size * (0.5 + Math.random() * 0.7)}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.borderRadius = Math.random() > 0.6 ? '50%' : '2px';
    piece.style.animationDuration = `${2.8 + Math.random() * 2.2}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 160}px`);

    piece.addEventListener('animationend', () => piece.remove(), { once: true });
    fragment.appendChild(piece);
  }

  document.body.appendChild(fragment);
}

/* ==========================================================
   MUSIC PLAYER
   ========================================================== */
function initMusicPlayer() {
  const toggle = document.getElementById('musicToggle');
  if (!toggle) return;

  setMusicUI(false);

  toggle.addEventListener('click', () => {
    if (musicFailed || musicAudio.error || musicAudio.paused) {
      startMusic(true);
    } else {
      musicAudio.pause();
    }
  });

  musicAudio.addEventListener('play', () => {
    musicFailed = false;
    setMusicUI(true);
  });
  musicAudio.addEventListener('pause', () => setMusicUI(false));
  musicAudio.addEventListener('error', () => {
    musicFailed = true;
    musicAudio.pause();
    setMusicUI(false);
    if (announceMusicFailure) {
      showMusicHint(`Music file not found. Add "${MUSIC_SRC}" to the project folder to enable sound.`);
    }
  });
}

/* ==========================================================
   INIT
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initGiftBox();
  initWishButton();
  initMusicPlayer();
});
