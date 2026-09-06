(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav
  const nav = document.getElementById("nav");
  const burger = document.getElementById("nav-burger");
  const drawer = document.getElementById("nav-drawer");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    if (drawer) {
      drawer.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
          nav.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  // Active nav highlight
  const links = Array.from(document.querySelectorAll(".nav__link[data-section]"));
  const sections = links
    .map((l) => document.getElementById(l.dataset.section))
    .filter(Boolean);

  function updateActive() {
    const y = window.scrollY + 100;
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

  // Fade-up on scroll
  const fadeEls = document.querySelectorAll(".fade-up");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    fadeEls.forEach((el) => io.observe(el));
  } else {
    fadeEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Animated counters
  function animateCount(el) {
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || "";
    const duration = 1200;
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(target * eased);
      el.textContent = value.toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(frame);
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
      { threshold: 0.4 }
    );
    counters.forEach((c) => cio.observe(c));
  } else {
    counters.forEach(animateCount);
  }

  // Lottie animations (lazy when in view)
  function initLottie(el) {
    if (!window.lottie || el.dataset.lottieReady) return;
    const src = el.getAttribute("data-src");
    if (!src) return;
    el.dataset.lottieReady = "1";
    try {
      window.lottie.loadAnimation({
        container: el,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: src,
      });
    } catch (err) {
      el.dataset.lottieReady = "";
      console.warn("Lottie failed:", src, err);
    }
  }

  function setupLotties() {
    const nodes = Array.from(document.querySelectorAll(".lottie[data-src]"));
    if (!nodes.length) return;

    if (!window.lottie) {
      // CDN may still be loading; retry briefly
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
        { rootMargin: "120px 0px", threshold: 0.01 }
      );
      nodes.forEach((el) => lio.observe(el));
    } else {
      nodes.forEach(initLottie);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupLotties);
  } else {
    setupLotties();
  }
})();
