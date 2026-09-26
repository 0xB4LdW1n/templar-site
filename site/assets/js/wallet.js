/* Templar Wallet page — theme, menu, reveals, the SCENE ENGINE and what drives the page around it
   (LendingPage/plan.md, 2026-09-24, third pass). A scene has steps (.sc-step, data-d seconds, data-cam camera); the
   engine puts `at-K` and `past-K` on the scene root, the step's camera on the stage, `.is-on` on [data-on] elements,
   timed classes on [data-beat] elements ("3@1.2 is-on; 4@0 is-lost"), counts [data-count="from>to"] up, and paints the
   player (play/pause, a dash per step, previous/next, arrow keys). The seven scenes are the chapters of ONE tour
   ([data-tour]): its rows pick a chapter (beside the stage on a wide screen, an accordion on phones), the clock
   hands over to the next one when a chapter ends, the arrows turn the page at either edge, play/pause is shared. Around it: [data-go] links open a chapter, the download switch picks the
   visitor's system and reskins the monitor ([data-os-pick]), [data-copy] copies a line. Everything runs only while on
   screen and the tab is visible; reduced motion shows every step finished. Without JavaScript every chapter and
   every step's text is listed, and the download shows all three systems. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var IT = document.documentElement.lang !== "en";
  var T = IT
    ? { pause: "Pausa", play: "Riproduci", step: "Passo", of: "di", dark: "Passa al tema scuro", light: "Passa al tema chiaro" }
    : { pause: "Pause", play: "Play", step: "Step", of: "of", dark: "Switch to the dark theme", light: "Switch to the light theme" };
  root.classList.add("has-play");

  /* ---------- theme (same key as the landing) ---------- */
  var osDark = window.matchMedia("(prefers-color-scheme: dark)");
  function currentTheme() { return root.getAttribute("data-theme") || (osDark.matches ? "dark" : "light"); }
  function paintTheme() {
    $$("[data-theme-toggle]").forEach(function (b) { b.setAttribute("aria-label", currentTheme() === "dark" ? T.light : T.dark); });
  }
  $$("[data-theme-toggle]").forEach(function (b) {
    b.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next); store.set("sp-theme", next); paintTheme();
    });
  });
  paintTheme();

  /* ---------- mobile menu ---------- */
  var menuBtn = $(".menu-btn"), nav = $(".nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", open ? "false" : "true");
      menuBtn.setAttribute("aria-expanded", open ? "false" : "true");
    });
    var closeMenu = function () { nav.setAttribute("data-open", "false"); menuBtn.setAttribute("aria-expanded", "false"); };
    $$(".nav-links a").forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.getAttribute("data-open") === "true") { closeMenu(); menuBtn.focus(); } });
    document.addEventListener("click", function (e) { if (nav.getAttribute("data-open") === "true" && !nav.contains(e.target)) closeMenu(); });
  }

  /* ---------- reveals, once, when they arrive ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.15 });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- the device: authored at 1000px (420px without its sidebar on phones), scaled to its box ---------- */
  var narrow = window.matchMedia("(max-width: 720px)");
  function fitDev(dev) {
    var dw = +dev.dataset.dw || (narrow.matches ? 420 : 1000);   /* data-dw: authored width that never changes (the hero) */
    var w = dev.clientWidth;
    if (w > 0) dev.style.setProperty("--k", (w / dw).toFixed(4));
  }
  var devs = $$("[data-dev]");
  var fitAll = function () { devs.forEach(fitDev); };
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function (entries) { entries.forEach(function (en) { fitDev(en.target); }); });
    devs.forEach(function (d) { ro.observe(d); });
  } else window.addEventListener("resize", fitAll);
  fitAll();
  window.addEventListener("load", fitAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

  /* ---------- helpers for the state vocabulary ---------- */
  function parseOn(spec) {
    /* "2", "1,3", "3+" → a predicate on the step number */
    var parts = String(spec).split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    return function (k) {
      return parts.some(function (p) {
        if (p.slice(-1) === "+") return k >= +p.slice(0, -1);
        if (p.indexOf("-") > 0) { var ab = p.split("-"); return k >= +ab[0] && k <= +ab[1]; }
        return k === +p;
      });
    };
  }
  function parseBeats(spec) {
    /* "3@1.2 is-on is-big; 4@0 is-lost" → [{k, t, classes}] */
    return String(spec).split(";").map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) {
      var m = s.match(/^(\d+)@([\d.]+)\s+(.+)$/);
      return m ? { k: +m[1], t: +m[2], classes: m[3].split(/\s+/) } : null;
    }).filter(Boolean);
  }
  function setClass(el, cls, on) {
    if (cls.indexOf("theme-") === 0) { if (on) el.setAttribute("data-theme", cls.slice(6)); else el.removeAttribute("data-theme"); return; }
    el.classList.toggle(cls, on);
  }
  function fmt(n) { return String(n); }

  /* ---------- the exploded view: leader lines from each plate's anchor to its flat label ---------- */
  function leaderLines(stage) {
    var svg = $("[data-xr-lines]", stage);
    if (!svg) return function () {};
    var box = stage.getBoundingClientRect();
    svg.setAttribute("viewBox", "0 0 " + Math.round(box.width) + " " + Math.round(box.height));
    return function draw() {
      var r = stage.getBoundingClientRect();
      svg.setAttribute("viewBox", "0 0 " + Math.round(r.width) + " " + Math.round(r.height));
      var out = "";
      $$("[data-label]", stage).forEach(function (lab) {
        if (!lab.classList.contains("is-in")) return;
        var key = lab.dataset.label;
        var a = $('[data-anchor-of="' + key + '"]', stage);
        if (!a) return;
        var ab = a.getBoundingClientRect(), lb = lab.getBoundingClientRect();
        var ax = ab.left + ab.width / 2 - r.left, ay = ab.top + ab.height / 2 - r.top;
        var lx = lb.left - r.left, ly = lb.top + lb.height / 2 - r.top;
        if (lx <= ax) return;
        var mx = Math.max(ax + 12, lx - 22);
        var hot = lab.classList.contains("is-hot") ? ' class="is-hot"' : "";
        out += '<path' + hot + ' d="M' + ax.toFixed(1) + " " + ay.toFixed(1) + " H" + mx.toFixed(1) + " V" + ly.toFixed(1) + " H" + lx.toFixed(1) + '"/>';
        out += '<circle cx="' + ax.toFixed(1) + '" cy="' + ay.toFixed(1) + '" r="3.5"/>';
      });
      svg.innerHTML = out;
    };
  }

  /* ---------- the scene engine ----------
     scene(sec) runs a scene on its own; scene(sec, host) runs it as a chapter of the tour: it plays only while
     the host says it is the active one, hands over at the end of its last step (host.ended) and at either edge
     (host.edge), shares play/pause with the other chapters (host.setWanted) and reports its progress (host.progress). */
  function scene(sec, host) {
    var steps = $$(".sc-step", sec);
    if (!steps.length) return null;
    var stage = $(".stage", sec);
    var stages = $$(".stage", sec);
    var play = $("[data-play]", sec), dotsBox = $("[data-dots]", sec);
    var onEls = $$("[data-on]", sec).map(function (el) { return { el: el, is: parseOn(el.dataset.on), cls: el.dataset.onClass || "is-on", was: null }; });
    var beatEls = $$("[data-beat]", sec).map(function (el) { return { el: el, beats: parseBeats(el.dataset.beat) }; });
    var countEls = $$("[data-count]", sec).map(function (el) {
      var ft = el.dataset.count.split(">"); return { el: el, from: +ft[0], to: +ft[1], is: parseOn(el.dataset.on || "1+"), done: -1 };
    });
    var draw = stage && stage.hasAttribute("data-xr") ? leaderLines(stage) : null;
    var drawUntil = 0;

    /* captions: the sentence arrives word by word */
    steps.forEach(function (li, i) {
      li.d = Math.max(0.5, parseFloat(li.dataset.d) || 4);
      li.cam = li.dataset.cam || "flat";
      var p = $(".sc-p", li);
      if (p && !reduce) {
        var words = p.textContent.split(/\s+/).filter(Boolean);
        p.textContent = "";
        words.forEach(function (w, j) {
          var e = document.createElement("span"); e.className = "w"; e.style.setProperty("--i", j); e.textContent = w;
          p.appendChild(e); if (j < words.length - 1) p.appendChild(document.createTextNode(" "));
        });
      }
    });
    var n = steps.length, cur = 0, elapsed = 0;   /* cur = index of the step on stage */
    var wanted = !reduce, inView = false, raf = 0, then = 0;
    var active = !host;                           /* a chapter plays only while it is the one on stage */

    /* the player: a dash per step */
    var dots = [];
    if (dotsBox) {
      steps.forEach(function (li, i) {
        var b = document.createElement("button"); b.type = "button"; b.className = "pl-dot";
        var name = $(".sc-k", li) ? $(".sc-k", li).textContent.replace(/^\d+\s*/, "").trim() : String(i + 1);
        b.setAttribute("aria-label", T.step + " " + (i + 1) + " " + T.of + " " + n + ": " + name); b.title = name;
        var fill = document.createElement("i"); b.appendChild(fill); dotsBox.appendChild(b);
        b.addEventListener("click", function () { jump(i); });
        dots.push({ b: b, fill: fill });
      });
    }

    function paintStatic(k) {
      /* everything that depends only on the step number */
      for (var i = 0; i < n; i++) {
        sec.classList.toggle("at-" + (i + 1), i === k);
        sec.classList.toggle("past-" + (i + 1), i < k);
        steps[i].classList.toggle("is-on", i === k);
        if (dots[i]) { if (i === k) dots[i].b.setAttribute("aria-current", "step"); else dots[i].b.removeAttribute("aria-current"); }
      }
      stages.forEach(function (st) { st.setAttribute("data-cam", steps[k].cam); });
      onEls.forEach(function (o) {
        var on = o.is(k + 1);
        if (on !== o.was) {
          o.el.classList.toggle(o.cls, on);
          if (o.el.classList.contains("dv-panel")) o.el.classList.toggle("is-past", !on && o.was === true && !o.is(k + 2));
          o.was = on;
        }
      });
      countEls.forEach(function (c) {
        var on = c.is(k + 1);
        if (on && c.done === -1) { c.done = k; count(c); }
        if (!on) { c.done = -1; if (c.id) { clearInterval(c.id); c.id = 0; } c.el.textContent = fmt(c.to); }
      });
      if (draw) drawUntil = performance.now() + 1400;
    }
    function count(c) {
      if (c.id) { clearInterval(c.id); c.id = 0; }
      if (reduce || !wanted) { c.el.textContent = fmt(c.to); return; }
      var v = c.from, dir = c.to >= c.from ? 1 : -1;
      c.el.textContent = fmt(v);
      c.id = setInterval(function () { v += dir; c.el.textContent = fmt(v); if (v === c.to) { clearInterval(c.id); c.id = 0; } }, 420);
    }
    function paintBeats(k, e) {
      var ee = reduce || !wanted ? 1e9 : e;   /* paused or still: every beat of the step already happened */
      beatEls.forEach(function (b) {
        b.beats.forEach(function (bt) {
          var on = bt.k === k + 1 && ee >= bt.t;
          bt.classes.forEach(function (c) { setClass(b.el, c, on); });
        });
      });
      /* a class asked by several beats of the same step must stay on if any of them says so */
      beatEls.forEach(function (b) {
        var want = {};
        b.beats.forEach(function (bt) { if (bt.k === k + 1 && ee >= bt.t) bt.classes.forEach(function (c) { want[c] = true; }); });
        Object.keys(want).forEach(function (c) { setClass(b.el, c, true); });
      });
    }
    function paintDots(k, e) {
      dots.forEach(function (d, i) {
        var f = i < k ? 1 : i > k ? 0 : Math.min(1, e / steps[k].d);
        d.fill.style.transform = "scaleX(" + f.toFixed(3) + ")";
      });
      /* --p: how far the step has played; paused or still, every step is shown finished */
      if (stage) stage.style.setProperty("--p", (wanted && !reduce && k === cur ? Math.min(1, e / steps[k].d) : 1).toFixed(3));
      if (host) host.progress(sec, (k + (wanted && !reduce ? Math.min(1, e / steps[k].d) : 1)) / n);
    }
    function show(k, e) {
      var changed = k !== cur;
      cur = k; elapsed = e;
      if (changed || !sec.classList.contains("at-" + (k + 1))) paintStatic(k);
      paintBeats(k, e); paintDots(k, e);
      if (draw && (changed || performance.now() < drawUntil)) draw();
    }
    function jump(k) { show(k, 0); run(); }
    function stepBy(dir) {
      var to = cur + dir;
      if (host && (to < 0 || to >= n)) { host.edge(sec, dir); return; }   /* the tour turns the page */
      jump((to % n + n) % n);
    }

    /* the clock */
    var tick = function (now) {
      raf = 0;
      var dt = Math.min(0.1, (now - then) / 1000); then = now;
      var e = elapsed + dt, k = cur;
      if (e >= steps[k].d + 0.35) {
        if (host && k === n - 1) { host.ended(sec); return; }            /* the next chapter takes over */
        k = (k + 1) % n; e = 0;
      }
      show(k, e);
      run();
    };
    var run = function () {
      var should = wanted && inView && active && !document.hidden && !reduce;
      if (should && !raf) { then = performance.now(); raf = requestAnimationFrame(tick); }
      if (!should && raf) { cancelAnimationFrame(raf); raf = 0; }
      if (!should && draw && performance.now() < drawUntil) { requestAnimationFrame(function again() { draw(); if (performance.now() < drawUntil) requestAnimationFrame(again); }); }
    };
    var paintBtn = function () {
      sec.classList.toggle("is-still", !wanted || reduce);   /* still: every animation of the step shown finished */
      if (!play) return;
      play.setAttribute("aria-label", wanted ? T.pause : T.play);
      var u = play.querySelector("use"); if (u) u.setAttribute("href", wanted ? "#i-pause" : "#i-play");
    };
    function setWanted(w) { wanted = w; paintBtn(); show(cur, elapsed); run(); }
    if (play) play.addEventListener("click", function () { if (host) host.setWanted(!wanted); else setWanted(!wanted); });
    $$("[data-by]", sec).forEach(function (b) { b.addEventListener("click", function () { stepBy(+b.dataset.by); }); });
    sec.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      if (e.target.closest("details, a")) return;
      var onDot = document.activeElement && document.activeElement.classList.contains("pl-dot");
      stepBy(e.key === "ArrowRight" ? 1 : -1);
      if (onDot && dots[cur]) dots[cur].b.focus();
      e.preventDefault();
    });
    if (!host) {
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) { inView = en[0].isIntersecting; run(); }, { threshold: 0.3 }).observe(sec);
      } else inView = true;
    }
    document.addEventListener("visibilitychange", run);
    if (draw) window.addEventListener("resize", function () { if (!active) return; drawUntil = performance.now() + 300; run(); draw(); });
    paintBtn();
    cur = -1; show(0, 0);
    run();
    return {
      /* k = 0 the first step, -1 the last one (arriving backwards) */
      activate: function (k) {
        active = true;
        devs.forEach(function (d) { if (sec.contains(d)) fitDev(d); });
        countEls.forEach(function (c) { c.done = -1; });
        cur = -1; show(k < 0 ? n - 1 : (k || 0), 0); run();
      },
      isPlaying: function () { return wanted && !reduce; },
      deactivate: function () { active = false; run(); },
      setWanted: setWanted,
      setInView: function (v) { inView = v; run(); },
      focusDot: function () { if (dots[cur]) dots[cur].b.focus({ preventScroll: true }); }
    };
  }

  /* ---------- the tour: seven chapters, one on stage. The rows are its control centre (beside the stage on a wide
     screen, an accordion on phones and tablets: CSS places the same [row, chapter] pairs); a row opens its chapter,
     the clock walks them in order ---------- */
  var tour = $("[data-tour]");
  var tourGo = null, tourHost = null, tourBring = null, eng = {};
  if (tour) {
    var chapters = $$(".chapter[data-scene]", tour), rows = $$(".tr-h[data-ch]", tour);
    var wide = window.matchMedia("(min-width: 1024px)");
    var order = [], on = null, tourIn = false;
    var rowOf = function (id) { return rows.filter(function (t) { return t.dataset.ch === id; })[0]; };
    var chOf = function (id) { return chapters.filter(function (c) { return c.dataset.scene === id; })[0]; };
    var host = {
      ended: function (sec) {
        /* the chapters differ in height: when the reader is below the tour, or has a real screenshot open,
           the chapter starts again instead of handing over, so nothing moves under their eyes */
        var r = tour.getBoundingClientRect(), open = $(".chapter.is-active details[open]", tour);
        if (open || r.bottom < window.innerHeight - 40) { go(sec.dataset.scene, 0); return; }
        var was = focusIn(sec);
        go(order[(order.indexOf(sec.dataset.scene) + 1) % order.length], 0);
        carryFocus(was);
      },
      edge: function (sec, dir) {
        var was = focusIn(sec);
        var i = order.indexOf(sec.dataset.scene) + dir;
        go(order[(i + order.length) % order.length], dir < 0 ? -1 : 0);
        carryFocus(was);
      },
      setWanted: function (w) { order.forEach(function (id) { eng[id].setWanted(w); }); },
      progress: function (sec, f) { var t = rowOf(sec.dataset.scene); if (t) t.parentNode.style.setProperty("--cp", Math.min(1, f).toFixed(3)); }
    };
    root.classList.add("has-tour");
    /* the keyboard stays where it was when the chapter changes under it: a dash on a dash, an arrow on the same
       arrow, play on play; anything else lands on the chapter's row */
    var focusIn = function (sec) { var ae = document.activeElement; return ae && sec.contains(ae) ? ae : null; };
    var carryFocus = function (was) {
      if (!was) return;
      if (was.classList.contains("pl-dot")) { eng[on].focusDot(); return; }
      var sel = was.hasAttribute("data-play") ? "[data-play]"
        : was.dataset.by ? (was.classList.contains("pl-side") ? ".pl-side" : ".pl-in") + '[data-by="' + was.dataset.by + '"]' : null;
      var twin = sel ? $(".chapter.is-active " + sel, tour) : rowOf(on);
      if (twin) twin.focus({ preventScroll: true });
    };
    chapters.forEach(function (c) { var api = scene(c, host); if (api) { eng[c.dataset.scene] = api; order.push(c.dataset.scene); } });
    var paintRow = function (id, open) {
      var t = rowOf(id), box = t.parentNode;
      t.setAttribute("aria-expanded", open ? "true" : "false");
      box.classList.toggle("is-on", open);
      if (!open) box.style.setProperty("--cp", "0");
    };
    var go = function (id, k) {
      if (!eng[id]) return;
      if (on !== id) {
        if (on) { eng[on].deactivate(); chOf(on).classList.remove("is-active"); paintRow(on, false); }
        on = id;
        chOf(id).classList.add("is-active"); paintRow(id, true);
      }
      eng[id].setInView(tourIn);
      eng[id].activate(k);
    };
    /* bring a chapter into view: on a wide screen the whole tour; on phones and tablets its row comes to the top,
       where it will sit once the rows above it have folded (they are still folding while the page scrolls) */
    var bring = function (id, how) {
      if (wide.matches) { tour.scrollIntoView({ behavior: how }); return; }
      var t = rowOf(id); if (!t) return;
      var fold = 0;
      for (var i = 0; i < rows.length && rows[i] !== t; i++) fold += $(".tr-more", rows[i].parentNode).offsetHeight;
      var y = t.getBoundingClientRect().top + window.scrollY - fold - (parseFloat(getComputedStyle(t).scrollMarginTop) || 0);
      window.scrollTo({ top: Math.max(0, y), behavior: how });
    };
    tourGo = go; tourHost = host; tourBring = bring;
    chapters.forEach(function (c) { c.classList.remove("is-active"); });
    rows.forEach(function (t) { paintRow(t.dataset.ch, false); });
    /* opening a real screenshot pauses the tour (the reader wants to look at it) */
    $$(".chapter details", tour).forEach(function (d) {
      d.addEventListener("toggle", function () { if (d.open && eng[on] && eng[on].isPlaying()) host.setWanted(false); });
    });
    /* the rows: a click opens the chapter (again from its start); up/down, Home and End walk them */
    var pickRow = function (t) { go(t.dataset.ch, 0); if (!wide.matches) bring(t.dataset.ch, reduce ? "auto" : "smooth"); };
    rows.forEach(function (t, i) {
      t.addEventListener("click", function () { pickRow(t); });
      t.addEventListener("keydown", function (e) {
        var j = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? rows.length - 1 : null;
        if (j === null) return;
        e.preventDefault();
        var nt = rows[(j + rows.length) % rows.length]; nt.focus({ preventScroll: true }); pickRow(nt);
      });
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { tourIn = en[0].isIntersecting; if (on) eng[on].setInView(tourIn); }, { threshold: 0.25 }).observe(tour);
    } else tourIn = true;
    /* old anchors of the one-scene-per-section page still land on their chapter */
    var legacy = { facile: "dash", guidato: "send", monete: "coins", chiavi: "keys", reti: "liquid", aperto: "open", firma: "sign" };
    var fromHash = function () {
      var h = location.hash.slice(1), id = h.indexOf("ch-") === 0 ? h.slice(3) : legacy[h];
      return eng[id] ? id : null;
    };
    var first = fromHash();
    go(first || order[0], 0);
    if (first) setTimeout(function () { bring(first, "instant"); }, 0);
    window.addEventListener("hashchange", function () { var id = fromHash(); if (id) { go(id, 0); bring(id, reduce ? "auto" : "smooth"); } });
  } else {
    $$("[data-scene]").forEach(function (s) { scene(s); });
  }

  /* links from elsewhere on the page (the footer) open a chapter and bring the tour into view */
  $$("[data-go]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (!tourGo) return;
      e.preventDefault();
      tourGo(a.dataset.go, +a.dataset.step || 0);
      if (a.dataset.step && eng[a.dataset.go] && eng[a.dataset.go].isPlaying()) tourHost.setWanted(false);
      tourBring(a.dataset.go, reduce ? "instant" : "smooth");
      var tb = document.getElementById("tr-" + a.dataset.go);
      if (tb) tb.focus({ preventScroll: true });
    });
  });

  /* ---------- the download: the visitor's system first, one monitor that changes its skin ---------- */
  var pick = $("[data-os-pick]");
  if (pick) {
    var osTabs = $$(".os-tab", pick), osPanels = $$(".os-panel", pick), skin = $(".mon-in", pick);
    var detect = function () {
      var ua = navigator.userAgent || "", pf = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
      if (/android/i.test(ua)) return "android";
      if (/iphone|ipad|ipod/i.test(ua)) return null;
      if (/mac/i.test(pf) && navigator.maxTouchPoints > 1) return null;   /* iPadOS Safari reports a Mac */
      if (/mac/i.test(pf) || /mac os x/i.test(ua)) return "macos";
      if (/win/i.test(pf) || /windows/i.test(ua)) return "windows";
      if (/linux|x11|cros/i.test(pf + " " + ua)) return "linux";
      return null;
    };
    var mine = detect();
    var osShow = function (os) {
      osTabs.forEach(function (t) {
        var is = t.dataset.os === os;
        t.setAttribute("aria-selected", is ? "true" : "false");
        if (is) t.removeAttribute("tabindex"); else t.setAttribute("tabindex", "-1");
      });
      osPanels.forEach(function (p) { var off = p.dataset.os !== os; p.classList.toggle("is-off", off); if (off) p.setAttribute("aria-hidden", "true"); else p.removeAttribute("aria-hidden"); });
      if (skin) skin.setAttribute("data-skin", os);
    };
    osTabs.forEach(function (t, i) {
      if (t.dataset.os === mine) t.classList.add("is-mine");
      t.addEventListener("click", function () { osShow(t.dataset.os); });
      t.addEventListener("keydown", function (e) {
        var j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
        if (j === null) return;
        e.preventDefault();
        var nt = osTabs[(j + osTabs.length) % osTabs.length]; osShow(nt.dataset.os); nt.focus();
      });
    });
    root.classList.add("has-os");
    osShow(mine && mine !== "android" ? mine : "macos");
    if (mine === "android") {
      var and = $(".and"), andCta = $(".and-cta");
      if (and) and.classList.add("is-mine");
      if (andCta) { andCta.classList.remove("btn"); andCta.classList.add("cta"); }
      $$('a[href="#scarica"]').forEach(function (a) { a.setAttribute("href", "#android"); });   /* straight to the APK */
    }
  }

  /* ---------- placeholders: links whose address is not published yet go nowhere instead of to the top ---------- */
  $$('a[href="#"][data-todo]').forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); }); });

  /* ---------- copy the clone line ---------- */
  $$("[data-copy]").forEach(function (b) {
    var label = b.textContent;
    b.addEventListener("click", function () {
      var text = b.dataset.copy, done = function () { b.textContent = b.dataset.copied || label; b.classList.add("is-done"); setTimeout(function () { b.textContent = label; b.classList.remove("is-done"); }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
      else {
        var ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "absolute"; ta.style.left = "-9999px";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  });

})();
