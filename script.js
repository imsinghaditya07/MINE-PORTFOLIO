(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll progress + sticky nav state ---------- */
  const bar = document.getElementById("progressBar");
  const nav = document.getElementById("nav");

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (bar) bar.style.width = pct + "%";
    if (nav) nav.classList.toggle("is-stuck", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");

  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      const open = mobileMenu.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    mobileMenu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        mobileMenu.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- reveal on scroll ---------- */
  const revealables = document.querySelectorAll(".reveal");

  function showAll() {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  }

  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      function (entries) {
        let shown = 0;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.style.transitionDelay = Math.min(shown++ * 70, 280) + "ms";
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealables.forEach(function (el) { io.observe(el); });

    // failsafe: if the observer never fired, don't leave the page blank
    window.addEventListener("load", function () {
      setTimeout(function () {
        if (!document.querySelector(".reveal.is-in")) showAll();
      }, 2000);
    });
  } else {
    showAll();
  }

  /* ---------- count-up stats ---------- */
  const counters = document.querySelectorAll("[data-count]");

  function runCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    const duration = 1400;
    const start = performance.now();

    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window && !reduceMotion) {
    const co = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCount(entry.target);
          co.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.textContent = (el.dataset.prefix || "") + el.dataset.count + (el.dataset.suffix || "");
    });
  }

  /* ---------- active section in nav ---------- */
  const navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__links a"));
  const sections = navLinks
    .map(function (a) {
      const href = a.getAttribute("href");
      return href && href.startsWith("#") ? document.querySelector(href) : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const so = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) { so.observe(s); });
  }

  /* ---------- gentle parallax on hero elements ---------- */
  const floaters = document.querySelectorAll("[data-float]");

  if (!reduceMotion && floaters.length) {
    let ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        const y = window.scrollY;
        floaters.forEach(function (el) {
          const speed = parseFloat(el.dataset.float);
          el.style.translate = "0 " + (y * speed * 0.12).toFixed(2) + "px";
        });
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- only one "messy version" open at a time ---------- */
  const detailsList = document.querySelectorAll(".messy");
  detailsList.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      detailsList.forEach(function (other) {
        if (other !== d) other.open = false;
      });
    });
  });

  /* ---------- interactive system deck showcase (project 2) ---------- */
  const deckViewport = document.getElementById("deckViewport");
  const deckTabs = document.querySelectorAll(".deck-tab");
  const deckPrevBtn = document.getElementById("deckPrevBtn");
  const deckNextBtn = document.getElementById("deckNextBtn");
  const deckBadge = document.getElementById("deckSlideBadge");
  const deckUrl = document.getElementById("deckUrl");
  const deckDotsContainer = document.getElementById("deckDots");

  if (deckViewport) {
    const slides = Array.from(deckViewport.querySelectorAll(".deck-slide"));
    const total = slides.length;
    let activeIndex = 0;
    const layerNames = ["Home", "The Scale", "Dashboard", "Live Vision"];
    const urls = [
      "signvoice-ai.web.app/home",
      "signvoice-ai.web.app/the-scale",
      "signvoice-ai.web.app/dashboard",
      "signvoice-ai.web.app/live-vision"
    ];

    function showSlide(index) {
      if (typeof window.showDeckSlide === "function") {
        window.showDeckSlide(index);
        return;
      }
      activeIndex = ((index % total) + total) % total;

      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === activeIndex);
      });

      deckTabs.forEach(function (tab, i) {
        const isCurrent = i === activeIndex;
        tab.classList.toggle("is-active", isCurrent);
        tab.setAttribute("aria-selected", String(isCurrent));
      });

      if (deckBadge) {
        deckBadge.textContent = "Layer " + (activeIndex + 1) + " of " + total + ": " + (layerNames[activeIndex] || "");
      }

      if (deckUrl && urls[activeIndex]) {
        deckUrl.textContent = urls[activeIndex];
      }

      if (deckDotsContainer) {
        const dots = deckDotsContainer.querySelectorAll(".deck-dot");
        dots.forEach(function (dot, i) {
          dot.classList.toggle("is-active", i === activeIndex);
        });
      }
    }

    // Fallback click listeners only if inline handlers are not defined
    if (typeof window.showDeckSlide !== "function") {
      deckTabs.forEach(function (tab, i) {
        tab.addEventListener("click", function (e) {
          e.preventDefault();
          showSlide(i);
        });
      });

      if (deckNextBtn) {
        deckNextBtn.addEventListener("click", function (e) {
          e.preventDefault();
          showSlide(activeIndex + 1);
        });
      }

      if (deckPrevBtn) {
        deckPrevBtn.addEventListener("click", function (e) {
          e.preventDefault();
          showSlide(activeIndex - 1);
        });
      }

      if (deckDotsContainer) {
        const dots = deckDotsContainer.querySelectorAll(".deck-dot");
        dots.forEach(function (dot, i) {
          dot.addEventListener("click", function (e) {
            e.preventDefault();
            showSlide(i);
          });
        });
      }
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        const rect = deckViewport.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          if (typeof window.stepDeckSlide === "function") {
            window.stepDeckSlide(-1);
          } else {
            showSlide(activeIndex - 1);
          }
        }
      } else if (e.key === "ArrowRight") {
        const rect = deckViewport.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          if (typeof window.stepDeckSlide === "function") {
            window.stepDeckSlide(1);
          } else {
            showSlide(activeIndex + 1);
          }
        }
      }
    });

    if (typeof window.showDeckSlide === "function") {
      window.showDeckSlide(0);
    } else {
      showSlide(0);
    }
  }

  /* ---------- interactive system deck showcase (project 1: ResumeYouNeed) ---------- */
  const resumeDeckViewport = document.getElementById("resumeDeckViewport");
  if (resumeDeckViewport) {
    if (typeof window.showResumeDeckSlide === "function") {
      window.showResumeDeckSlide(0);
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        const rect = resumeDeckViewport.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          if (typeof window.stepResumeDeckSlide === "function") {
            window.stepResumeDeckSlide(-1);
          }
        }
      } else if (e.key === "ArrowRight") {
        const rect = resumeDeckViewport.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          if (typeof window.stepResumeDeckSlide === "function") {
            window.stepResumeDeckSlide(1);
          }
        }
      }
    });
  }

  /* ---------- footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = "© " + new Date().getFullYear();
  }
})();
