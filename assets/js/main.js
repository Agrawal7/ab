(() => {
  "use strict";

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const prefersReducedMotion = () => motionQuery.matches;

  /* ---------- Gentle scroll reveals ---------- */

  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  let revealObserver = null;

  function markRevealed(el) {
    if (el.classList.contains("is-visible")) return;
    el.classList.add("is-visible");
    if (revealObserver) revealObserver.unobserve(el);
  }

  if ("IntersectionObserver" in window && !prefersReducedMotion()) {
    revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            markRevealed(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));

    // Catch anything skipped during very fast scrolling.
    let frameQueued = false;

    function revealPassed() {
      frameQueued = false;
      const threshold = window.innerHeight * 0.94;
      let pending = 0;

      revealEls.forEach((el) => {
        if (el.classList.contains("is-visible")) return;
        if (el.getBoundingClientRect().top < threshold) {
          markRevealed(el);
        } else {
          pending += 1;
        }
      });

      if (!pending) {
        window.removeEventListener("scroll", queueReveal);
        window.removeEventListener("resize", queueReveal);
      }
    }

    function queueReveal() {
      if (frameQueued) return;
      frameQueued = true;
      window.requestAnimationFrame(revealPassed);
    }

    window.addEventListener("scroll", queueReveal, { passive: true });
    window.addEventListener("resize", queueReveal, { passive: true });
    window.requestAnimationFrame(revealPassed);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(queueReveal).catch(() => {});
    }
  } else {
    revealEls.forEach(markRevealed);
  }

  /* ---------- Confetti ---------- */

  const canvas = document.getElementById("confetti");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const colors = ["#C77E88", "#E8A6A6", "#E6C47E", "#A8BFA3", "#B7A8D0", "#F2C6CB", "#FFF3D6"];
  let particles = [];
  let frame = null;
  let dpr = 1;

  function sizeCanvas() {
    if (!canvas || !ctx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawParticle(p) {
    const fade = Math.min(1, (p.maxLife - p.life) / 18);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = Math.max(0, fade);
    ctx.fillStyle = p.color;

    if (p.shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    }

    ctx.restore();
  }

  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((p) => {
      p.vy += 0.14;
      p.vx *= 0.995;
      p.x += p.vx + Math.sin(p.life * 0.08 + p.wobble) * 0.35;
      p.y += p.vy;
      p.rotation += p.spin;
      p.life += 1;
    });

    particles = particles.filter(
      (p) => p.life < p.maxLife && p.y < window.innerHeight + 50 && p.x > -60 && p.x < window.innerWidth + 60
    );

    particles.forEach(drawParticle);

    if (particles.length) {
      frame = window.requestAnimationFrame(tick);
    } else {
      frame = null;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  function burst(x, y, count = 90) {
    if (!canvas || !ctx || prefersReducedMotion()) return;

    for (let i = 0; i < count; i += 1) {
      if (particles.length >= 190) break;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.95;
      const speed = 5 + Math.random() * 9;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.24,
        shape: Math.random() > 0.35 ? "rect" : "circle",
        life: 0,
        maxLife: 80 + Math.random() * 50,
        wobble: Math.random() * Math.PI * 2
      });
    }

    if (!frame) frame = window.requestAnimationFrame(tick);
  }

  if (canvas && ctx) {
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas, { passive: true });
  }

  /* ---------- Cake + candles ---------- */

  const candles = Array.from(document.querySelectorAll(".candle"));
  const blowButton = document.getElementById("blow-button");
  const blowLabel = document.getElementById("blow-button-label");
  const wishStatus = document.getElementById("wish-status");
  const wishCard = document.querySelector(".wish-card");
  const cake = document.querySelector(".cake");
  let litCount = candles.length;
  let completed = false;

  const statusMessages = {
    3: "Three candles, still lit.",
    2: "Two candles to go.",
    1: "One candle left. Make it count.",
    0: "All three out. That one’s going to count."
  };

  function updateStatus() {
    if (wishStatus) wishStatus.textContent = statusMessages[litCount];
  }

  function celebrate() {
    if (!cake) return;
    const rect = cake.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height * 0.38, 110);
  }

  function completeWish() {
    if (completed) return;
    completed = true;
    if (wishCard) wishCard.classList.add("is-complete");
    if (blowLabel) blowLabel.textContent = "Light them again";
    updateStatus();
    celebrate();
  }

  function extinguish(candle) {
    if (candle.classList.contains("is-out")) return;

    candle.classList.add("is-out");
    const number = candles.indexOf(candle) + 1;
    candle.setAttribute("aria-label", `Candle ${number}, out`);
    litCount = Math.max(0, litCount - 1);
    updateStatus();

    if (litCount === 0) completeWish();
  }

  function resetWish() {
    completed = false;
    litCount = candles.length;

    candles.forEach((candle, index) => {
      candle.classList.remove("is-out");
      candle.setAttribute("aria-label", `Candle ${index + 1}, lit`);
    });

    if (wishCard) wishCard.classList.remove("is-complete");
    if (blowLabel) blowLabel.textContent = "Blow out the candles";
    updateStatus();
  }

  candles.forEach((candle) => {
    candle.addEventListener("click", () => extinguish(candle));
  });

  if (blowButton) {
    blowButton.addEventListener("click", () => {
      if (completed || litCount === 0) {
        resetWish();
        return;
      }

      const remaining = candles.filter((candle) => !candle.classList.contains("is-out"));
      if (!remaining.length) return;

      blowButton.disabled = true;
      remaining.forEach((candle, index) => {
        window.setTimeout(() => extinguish(candle), index * 190);
      });

      window.setTimeout(() => {
        blowButton.disabled = false;
      }, (remaining.length - 1) * 190 + 280);
    });
  }

  /* ---------- Extra sprinkle ---------- */

  const confettiButton = document.getElementById("confetti-button");

  if (confettiButton) {
    confettiButton.addEventListener("click", () => {
      const rect = confettiButton.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 80);
      if (prefersReducedMotion()) {
        showToast("Consider it sprinkled. Happy birthday, Anushka.");
      }
    });
  }

  /* ---------- Hidden note ---------- */

  const toast = document.getElementById("toast");
  const secretNote = document.getElementById("secret-note");
  const hiddenNotes = [
    "You found the hidden note. May your chai always be exactly the right temperature.",
    "Secret note: you’re allowed to re-read your birthday letter whenever you like.",
    "P.S. Cake is calorie-free today. It’s in the birthday rules."
  ];
  let noteIndex = 0;
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 4800);
  }

  if (secretNote) {
    secretNote.addEventListener("click", () => {
      showToast(hiddenNotes[noteIndex % hiddenNotes.length]);
      noteIndex += 1;
    });
  }
})();
