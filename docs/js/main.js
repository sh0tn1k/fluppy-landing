(function () {
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
        el.style.setProperty("--delay", `${i * 0.06}s`);
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

  // Soft parallax on hero visual
  const parallaxEls = document.querySelectorAll("[data-parallax]");
  if (!reduceMotion && parallaxEls.length) {
    let ticking = false;
    function onScrollParallax() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        parallaxEls.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const mid = rect.top + rect.height / 2 - window.innerHeight / 2;
          const offset = Math.max(-18, Math.min(18, mid * -0.04));
          el.style.transform = `translate3d(0, ${offset}px, 0)`;
        });
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScrollParallax, { passive: true });
    onScrollParallax();
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
      // easeOutExpo-ish, similar to snappy major counters
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

  // Lottie animations (lazy when in view) + optional hover play
  const lottieAnims = new WeakMap();

  function initLottie(el) {
    if (!window.lottie || el.dataset.lottieReady) return;
    const src = el.getAttribute("data-src");
    if (!src) return;
    el.dataset.lottieReady = "1";
    try {
      const hoverPlay = el.hasAttribute("data-hover-play");
      const anim = window.lottie.loadAnimation({
        container: el,
        renderer: "svg",
        loop: true,
        autoplay: !hoverPlay,
        path: src,
        rendererSettings: {
          progressiveLoad: true,
          hideOnTransparent: true,
        },
      });
      lottieAnims.set(el, anim);

      if (hoverPlay) {
        // Start once so first frame paints, then pause until hover
        anim.addEventListener("DOMLoaded", () => {
          anim.goToAndStop(0, true);
        });
        const play = () => {
          const a = lottieAnims.get(el);
          if (a) a.play();
        };
        const pause = () => {
          const a = lottieAnims.get(el);
          if (a) a.pause();
        };
        const host = el.closest(".strip__item, .usecase-card, .trust__mascot, .cta-band__visual, .hero__brand") || el;
        host.addEventListener("mouseenter", play);
        host.addEventListener("mouseleave", pause);
        host.addEventListener("focusin", play);
        host.addEventListener("focusout", pause);
        // Touch: brief play
        host.addEventListener(
          "touchstart",
          () => {
            play();
            setTimeout(pause, 1800);
          },
          { passive: true }
        );
      }
    } catch (err) {
      el.dataset.lottieReady = "";
      console.warn("Lottie failed:", src, err);
    }
  }

  function setupLotties() {
    const nodes = Array.from(document.querySelectorAll(".lottie[data-src]"));
    if (!nodes.length) return;

    if (!window.lottie) {
      let tries = 0;
      const wait = setInterval(() => {
        tries += 1;
        if (window.lottie || tries > 40) {
          clearInterval(wait);
          if (window.lottie) setupLotties();
        }
      }, 50);
      return;
    }

    // Eager-load hero / logo Lotties; lazy-load the rest
    const eager = [];
    const lazy = [];
    nodes.forEach((el) => {
      if (el.classList.contains("lottie--hero") || el.classList.contains("hero__logo")) {
        eager.push(el);
      } else {
        lazy.push(el);
      }
    });
    eager.forEach(initLottie);

    if ("IntersectionObserver" in window) {
      const lio = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              initLottie(e.target);
              lio.unobserve(e.target);
            }
          });
        },
        { rootMargin: "180px 0px", threshold: 0.01 }
      );
      lazy.forEach((el) => lio.observe(el));
    } else {
      lazy.forEach(initLottie);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupLotties);
  } else {
    setupLotties();
  }
})();
