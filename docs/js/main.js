import { createTLottiePlayer, initializeTLottie } from "./tlottie/index.js";

initializeTLottie();

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Mobile nav
const nav = document.getElementById("nav");
const burger = document.getElementById("nav-burger");
const drawer = document.getElementById("nav-drawer");
if (burger && nav) {
  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-lock", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  burger.addEventListener("click", () => {
    setOpen(!nav.classList.contains("is-open"));
  });
  if (drawer) {
    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => setOpen(false));
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

// Nav scrolled state
function updateNavScroll() {
  if (!nav) return;
  nav.classList.toggle("is-scrolled", window.scrollY > 12);
}
window.addEventListener("scroll", updateNavScroll, { passive: true });
updateNavScroll();

// Active nav highlight
const links = Array.from(document.querySelectorAll(".nav__link[data-section]"));
const sections = links
  .map((l) => document.getElementById(l.dataset.section))
  .filter(Boolean);

function updateActive() {
  const y = window.scrollY + 120;
  let current = sections[0];
  for (const s of sections) {
    if (s.offsetTop <= y) current = s;
  }
  links.forEach((l) => {
    l.classList.toggle("is-active", current && l.dataset.section === current.id);
  });
}
window.addEventListener("scroll", updateActive, { passive: true });
updateActive();

// Stagger siblings inside .stagger containers
document.querySelectorAll(".stagger").forEach((group) => {
  const kids = group.querySelectorAll(":scope > .fade-up");
  kids.forEach((el, i) => {
    if (!el.style.getPropertyValue("--delay")) {
      el.style.setProperty("--delay", `${i * 0.08}s`);
    }
  });
});

// Fade-up on scroll
const fadeEls = document.querySelectorAll(".fade-up");
if (reduceMotion) {
  fadeEls.forEach((el) => el.classList.add("is-visible"));
} else if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
  );
  fadeEls.forEach((el) => io.observe(el));
} else {
  fadeEls.forEach((el) => el.classList.add("is-visible"));
}

// Soft parallax on hero visual — lerped for smooth deceleration
const parallaxEls = document.querySelectorAll("[data-parallax]");
if (!reduceMotion && parallaxEls.length) {
  const state = new Map();
  parallaxEls.forEach((el) => state.set(el, { current: 0, target: 0 }));
  let raf = 0;
  function measureTargets() {
    parallaxEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2 - window.innerHeight / 2;
      const target = Math.max(-16, Math.min(16, mid * -0.035));
      const s = state.get(el);
      if (s) s.target = target;
    });
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    let moving = false;
    parallaxEls.forEach((el) => {
      const s = state.get(el);
      if (!s) return;
      const next = s.current + (s.target - s.current) * 0.08;
      if (Math.abs(next - s.current) > 0.05) moving = true;
      s.current = Math.abs(s.target - next) < 0.05 ? s.target : next;
      el.style.transform = `translate3d(0, ${s.current.toFixed(2)}px, 0)`;
    });
    raf = moving ? requestAnimationFrame(tick) : 0;
  }
  window.addEventListener("scroll", measureTargets, { passive: true });
  window.addEventListener("resize", measureTargets, { passive: true });
  measureTargets();
}

// Animated counters (major.bot-style count-up with commas)
function formatCount(value) {
  return Math.round(value).toLocaleString("en-US");
}

function animateCount(el) {
  const target = Number(el.dataset.count || 0);
  const suffix = el.dataset.suffix || "";
  const duration = reduceMotion ? 0 : Number(el.dataset.duration || 2000);
  const start = performance.now();
  el.classList.add("is-counting");
  function frame(now) {
    const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
    const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const value = target * eased;
    el.textContent = formatCount(value) + suffix;
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = formatCount(target) + suffix;
      el.classList.remove("is-counting");
      el.classList.add("is-counted");
    }
  }
  requestAnimationFrame(frame);
}

const counters = document.querySelectorAll("[data-count]");
if ("IntersectionObserver" in window) {
  const cio = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(e.target);
          cio.unobserve(e.target);
        }
      });
    },
    { threshold: 0.35, rootMargin: "0px 0px -10% 0px" }
  );
  counters.forEach((c) => cio.observe(c));
} else {
  counters.forEach(animateCount);
}

// FAQ accordion
const faqItems = document.querySelectorAll(".faq__item");
faqItems.forEach((item) => {
  const btn = item.querySelector(".faq__q");
  const panel = item.querySelector(".faq__a");
  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    const open = item.classList.contains("is-open");
    faqItems.forEach((other) => {
      if (other === item) return;
      other.classList.remove("is-open");
      const ob = other.querySelector(".faq__q");
      const op = other.querySelector(".faq__a");
      if (ob) ob.setAttribute("aria-expanded", "false");
      if (op) op.hidden = true;
    });
    item.classList.toggle("is-open", !open);
    btn.setAttribute("aria-expanded", !open ? "true" : "false");
    panel.hidden = open;
  });
});

// Lottie animations via tlottie (WASM / OffscreenCanvas / worker)
const lottieAnims = new WeakMap();
const LOTTIE_CONCURRENCY = 3;
let lottieInFlight = 0;
const lottieQueue = [];
let lottieIo = null;

function resolveLottieSrc(src) {
  try {
    return new URL(src, document.baseURI).href;
  } catch (_) {
    return src;
  }
}

function pumpLottieQueue() {
  while (lottieInFlight < LOTTIE_CONCURRENCY && lottieQueue.length) {
    const job = lottieQueue.shift();
    lottieInFlight += 1;
    job(() => {
      lottieInFlight -= 1;
      pumpLottieQueue();
    });
  }
}

function enqueueLottie(run) {
  lottieQueue.push(run);
  pumpLottieQueue();
}

function clearLottieReady(el) {
  delete el.dataset.lottieReady;
}

function destroyLottie(el) {
  const handle = lottieAnims.get(el);
  if (handle) {
    try {
      handle.destroy();
    } catch (_) {}
    lottieAnims.delete(el);
  }
  el.innerHTML = "";
}

function initLottie(el, attempt) {
  if (el.dataset.lottieReady) return;
  const rawSrc = el.getAttribute("data-src");
  if (!rawSrc) return;
  const src = resolveLottieSrc(rawSrc);
  const retry = typeof attempt === "number" ? attempt : 0;
  el.dataset.lottieReady = "1";

  if (lottieIo) {
    try {
      lottieIo.unobserve(el);
    } catch (_) {}
  }

  enqueueLottie((done) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      done();
    };

    try {
      const hoverPlay = el.hasAttribute("data-hover-play");
      const shouldAutoplay = !reduceMotion;
      const isHero =
        el.classList.contains("lottie--hero") || el.classList.contains("hero__logo");
      const speed = isHero ? 0.88 : 0.78;

      const handle = createTLottiePlayer(el, {
        src,
        loop: true,
        autoplay: shouldAutoplay,
        speed,
      });
      lottieAnims.set(el, handle);

      const onFail = (ev) => {
        console.warn("Lottie failed:", src, ev && ev.error ? ev.error : ev);
        destroyLottie(el);
        clearLottieReady(el);
        finish();
        if (retry < 1) {
          setTimeout(() => initLottie(el, retry + 1), 500);
        }
      };

      handle.tlottie.on("error", onFail);
      handle.tlottie.on("load", () => {
        try {
          if (shouldAutoplay) {
            handle.tlottie.play();
          } else {
            handle.tlottie.pause();
            handle.tlottie.seek(0);
          }
        } catch (err) {
          console.warn("Lottie first-frame seek failed:", src, err);
        }
        finish();
      });
      setTimeout(finish, 15000);

      if (hoverPlay) {
        const play = () => {
          const h = lottieAnims.get(el);
          if (!h) return;
          try {
            h.tlottie.seek(0);
            h.tlottie.play();
          } catch (_) {}
        };
        const host =
          el.closest(
            ".strip__item, .usecase-card, .trust__mascot, .cta-band__visual, .hero__brand"
          ) || el;
        host.addEventListener("mouseenter", play);
        host.addEventListener("focusin", play);
        host.addEventListener("touchstart", play, { passive: true });
      }
    } catch (err) {
      clearLottieReady(el);
      console.warn("Lottie failed:", src, err);
      finish();
      if (retry < 1) {
        setTimeout(() => initLottie(el, retry + 1), 500);
      }
    }
  });
}

function initLottiesIn(root) {
  if (!root) return;
  const scope = root.querySelectorAll ? root.querySelectorAll(".lottie[data-src]") : [];
  const list =
    root.matches && root.matches(".lottie[data-src]") ? [root, ...scope] : [...scope];
  list.forEach((el) => initLottie(el));
}

function scheduleIdlePreload(nodes) {
  let i = 0;
  const tick = () => {
    while (i < nodes.length) {
      const el = nodes[i++];
      if (el.dataset.lottieReady) continue;
      initLottie(el);
      setTimeout(tick, 120);
      return;
    }
  };
  setTimeout(tick, 400);
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(
      () => {
        nodes.forEach((el) => {
          if (!el.dataset.lottieReady) initLottie(el);
        });
      },
      { timeout: 2500 }
    );
  }
}

function setupLotties() {
  const nodes = Array.from(document.querySelectorAll(".lottie[data-src]"));
  if (!nodes.length) return;

  const eager = [];
  const lazy = [];
  nodes.forEach((el) => {
    if (el.classList.contains("lottie--hero") || el.classList.contains("hero__logo")) {
      eager.push(el);
    } else {
      lazy.push(el);
    }
  });
  eager.forEach((el) => initLottie(el));

  if ("IntersectionObserver" in window) {
    lottieIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            initLottie(e.target);
            lottieIo.unobserve(e.target);
          }
        });
      },
      { rootMargin: "600px 0px", threshold: 0.01 }
    );
    lazy.forEach((el) => lottieIo.observe(el));
  } else {
    lazy.forEach((el) => initLottie(el));
  }

  scheduleIdlePreload(lazy);

  function initFromHash() {
    const hash = location.hash.replace(/^#/, "");
    if (!hash) return;
    const section = document.getElementById(hash);
    if (section) initLottiesIn(section);
  }

  window.addEventListener("hashchange", initFromHash);
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", () => {
      const id = (a.getAttribute("href") || "").replace(/^#/, "");
      if (!id) return;
      requestAnimationFrame(() => {
        const section = document.getElementById(id);
        if (section) initLottiesIn(section);
      });
    });
  });
  initFromHash();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupLotties);
} else {
  setupLotties();
}
